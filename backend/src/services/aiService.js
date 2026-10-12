import '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { validateChoices } from './quizService.js';

/**
 * Sinh câu hỏi trắc nghiệm bằng Google Gemini (api-quizzes.md mục 2.19-2.20, SEQ-AI-001).
 * Gọi REST API generateContent với responseSchema để ép Gemini trả JSON đúng cấu trúc.
 * Cấu hình TÙY CHỌN: thiếu GEMINI_API_KEY thì API AI trả 503, phần còn lại của server vẫn chạy.
 */
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 60 * 1000;
const RETRY_DELAYS_MS = [1000, 3000];
const MIN_WORDS = 100;

const DIFFICULTY_TEXT = {
  easy: 'DỄ (nhớ và hiểu kiến thức cơ bản)',
  medium: 'TRUNG BÌNH (hiểu và vận dụng)',
  hard: 'KHÓ (phân tích, so sánh, vận dụng cao)'
};

const TYPE_RULES = {
  single_choice: 'Tất cả câu hỏi là "single_choice": đúng 4 lựa chọn, chỉ 1 đáp án đúng.',
  multiple_choice: 'Tất cả câu hỏi là "multiple_choice": đúng 4 lựa chọn, có từ 2 đến 3 đáp án đúng.',
  true_false: 'Tất cả câu hỏi là "true_false": đúng 2 lựa chọn theo thứ tự "Đúng", "Sai"; chỉ 1 đáp án đúng.',
  mixed: 'Trộn cả 3 loại "single_choice" (4 lựa chọn, 1 đúng), "multiple_choice" (4 lựa chọn, 2-3 đúng) và "true_false" (2 lựa chọn "Đúng"/"Sai", 1 đúng).'
};

// JSON Schema (OpenAPI subset) mà Gemini bắt buộc tuân theo
const QUESTION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    content: { type: 'STRING' },
    // Không khai báo enum (một số phiên bản API yêu cầu kèm format: 'enum'); loại câu hỏi được kiểm tra lại ở normalizeQuestions
    questionType: { type: 'STRING' },
    explanation: { type: 'STRING' },
    choices: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { content: { type: 'STRING' }, isCorrect: { type: 'BOOLEAN' } },
        required: ['content', 'isCorrect']
      }
    }
  },
  required: ['content', 'questionType', 'explanation', 'choices']
};

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: { questions: { type: 'ARRAY', items: QUESTION_SCHEMA } },
  required: ['questions']
};

const getConfig = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError('Tính năng AI chưa được cấu hình (thiếu GEMINI_API_KEY trong backend/.env)', 503, 'Service Unavailable');
  }
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  // Model dự phòng khi model chính quá tải / bị Google ngừng: dòng Flash-Lite nhanh và ít bị quá tải
  const fallback = process.env.GEMINI_FALLBACK_MODEL ?? 'gemini-flash-lite-latest';
  return { apiKey, models: [...new Set([model, fallback].filter(Boolean))] };
};

export const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;

const assertDocumentLength = (documentText) => {
  if (countWords(documentText) < MIN_WORDS) {
    throw new AppError(`Văn bản nguồn quá ngắn (dưới ${MIN_WORDS} từ)`, 400, 'Bad Request');
  }
};

const buildPrompt = ({ documentText, numQuestions, difficulty, questionType, previousQuestionPrompt }) => [
  'Bạn là giảng viên ra đề thi trắc nghiệm cho nền tảng học trực tuyến EduVerse.',
  `Hãy soạn ${numQuestions} câu hỏi trắc nghiệm, độ khó ${DIFFICULTY_TEXT[difficulty]}, dựa DUY NHẤT vào kiến thức trong tài liệu bên dưới.`,
  'Yêu cầu:',
  `- ${TYPE_RULES[questionType]}`,
  '- Ngôn ngữ: viết câu hỏi và lựa chọn bằng tiếng Việt. RIÊNG khi tài liệu dạy ngoại ngữ (tiếng Anh, tiếng Nhật...), viết câu hỏi và lựa chọn bằng chính ngoại ngữ đó theo dạng bài tập (điền vào chỗ trống "___", chọn từ/cấu trúc đúng, tìm lỗi sai); "explanation" luôn bằng tiếng Việt.',
  '- Học viên KHÔNG được xem tài liệu khi làm bài: không viết "theo tài liệu", "tài liệu nêu", "dựa vào tài liệu" trong câu hỏi hay lựa chọn.',
  '- Ưu tiên câu hỏi VẬN DỤNG kiến thức vào ví dụ/tình huống mới thay vì hỏi lại nguyên văn định nghĩa.',
  '- Mỗi câu hỏi rõ ràng, chỉ có một cách hiểu, không hỏi kiến thức nằm ngoài tài liệu.',
  '- Các phương án sai phải hợp lý (không vô lý hiển nhiên), độ dài tương đương phương án đúng.',
  '- Không dùng phương án kiểu "Tất cả các đáp án trên" hoặc "Không có đáp án nào".',
  '- "explanation": giải thích ngắn gọn (1-2 câu) vì sao đáp án đúng, có dẫn chứng từ tài liệu.',
  '- Không lặp lại ý giữa các câu hỏi.',
  ...(previousQuestionPrompt
    ? [`- Câu hỏi mới phải KHÁC HẲN câu hỏi cũ sau (khác ý hỏi, không diễn đạt lại): "${previousQuestionPrompt}"`]
    : []),
  '',
  'TÀI LIỆU:',
  '"""',
  documentText,
  '"""'
].join('\n');

/**
 * Gửi 1 request generateContent tới 1 model; tự thử lại khi Gemini báo 500/503 tạm thời (sau 1s, 3s)
 */
const requestModel = async (model, apiKey, prompt, signal) => {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.7
        }
      }),
      signal
    });
    if (![500, 503].includes(response.status) || attempt >= RETRY_DELAYS_MS.length) return response;
    console.warn(`⚠️ Gemini ${model} HTTP ${response.status}, thử lại lần ${attempt + 1}...`);
    await response.body?.cancel().catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
  }
};

/**
 * Gọi Gemini và trả về { questions, model }.
 * Model chính vẫn quá tải sau khi thử lại (hoặc không còn tồn tại - 404) -> chuyển sang model dự phòng.
 */
const callGemini = async (prompt) => {
  const { apiKey, models } = getConfig();
  // Mọi lần thử dùng chung 1 hạn chót để request của giảng viên không treo quá lâu
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  let model;
  try {
    for (const [index, candidate] of models.entries()) {
      model = candidate;
      response = await requestModel(model, apiKey, prompt, controller.signal);
      const hasNext = index < models.length - 1;
      if (!hasNext || ![404, 500, 503].includes(response.status)) break;
      const detail = await response.text().catch(() => '');
      console.warn(`⚠️ Gemini ${model} HTTP ${response.status} -> chuyển sang model dự phòng ${models[index + 1]}`, response.status === 404 ? detail.slice(0, 200) : '');
    }
  } catch (error) {
    console.error('⚠️ Không gọi được Gemini API:', error.name, error.message);
    throw new AppError('Dịch vụ AI đang bận hoặc không phản hồi, vui lòng thử lại sau', 503, 'Service Unavailable');
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) {
    throw new AppError('Vượt quá giới hạn gọi AI, vui lòng thử lại sau ít phút', 429, 'Too Many Requests');
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error(`⚠️ Gemini API lỗi HTTP ${response.status} (model ${model}):`, detail.slice(0, 500));
    if ([500, 503].includes(response.status)) {
      throw new AppError('Dịch vụ AI đang quá tải, vui lòng thử lại sau ít phút', 503, 'Service Unavailable');
    }
    // 400/401/403/404 thường là cấu hình sai (API key, tên model GEMINI_MODEL)
    throw new AppError('Dịch vụ AI chưa được cấu hình đúng (kiểm tra GEMINI_API_KEY / GEMINI_MODEL)', 503, 'Service Unavailable');
  }

  const body = await response.json().catch(() => null);
  const text = body?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('');
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed?.questions)) throw new Error('missing questions');
    return { questions: parsed.questions, model };
  } catch {
    console.error('⚠️ Gemini trả về dữ liệu không đúng cấu trúc:', String(text).slice(0, 300), body?.candidates?.[0]?.finishReason);
    throw new AppError('Phản hồi từ AI không đúng cấu trúc, vui lòng thử lại', 502, 'Bad Gateway');
  }
};

/**
 * Chuẩn hóa & loại câu hỏi AI sinh sai luật (thiếu đáp án đúng, sai số lựa chọn...)
 */
const normalizeQuestions = (rawQuestions, requestedType) => rawQuestions
  .map((raw) => {
    const questionType = requestedType === 'mixed' ? raw?.questionType : requestedType;
    const choices = (Array.isArray(raw?.choices) ? raw.choices : [])
      .map((c) => ({ content: String(c?.content || '').trim(), isCorrect: c?.isCorrect === true }))
      .filter((c) => c.content);
    const content = String(raw?.content || '').trim();
    if (!content || !['single_choice', 'multiple_choice', 'true_false'].includes(questionType)) return null;
    try {
      validateChoices(questionType, choices);
    } catch {
      return null;
    }
    return { content, questionType, points: 1, explanation: String(raw?.explanation || '').trim() || null, choices };
  })
  .filter(Boolean);

const withTempIds = (question, tempId) => ({
  tempId,
  ...question,
  choices: question.choices.map((choice, index) => ({ tempId: `opt-${index + 1}`, ...choice }))
});

/**
 * POST /ai/generate-questions
 */
export const generateQuestions = async ({ documentText, numQuestions, difficulty, questionType }) => {
  assertDocumentLength(documentText);
  const { questions: raw, model } = await callGemini(buildPrompt({ documentText, numQuestions, difficulty, questionType }));
  const questions = normalizeQuestions(raw, questionType).slice(0, numQuestions);
  if (questions.length === 0) {
    throw new AppError('Phản hồi từ AI không đúng cấu trúc, vui lòng thử lại', 502, 'Bad Gateway');
  }

  const stamp = Date.now().toString(36);
  return {
    totalGenerated: questions.length,
    requested: numQuestions,
    model,
    questions: questions.map((q, index) => withTempIds(q, `ai-gen-${stamp}-${index + 1}`))
  };
};

/**
 * POST /ai/regenerate-single
 */
export const regenerateSingle = async ({ documentText, previousQuestionPrompt, difficulty, questionType }) => {
  assertDocumentLength(documentText);
  const { questions: raw, model } = await callGemini(buildPrompt({ documentText, numQuestions: 1, difficulty, questionType, previousQuestionPrompt }));
  const [question] = normalizeQuestions(raw, questionType);
  if (!question) {
    throw new AppError('Phản hồi từ AI không đúng cấu trúc, vui lòng thử lại', 502, 'Bad Gateway');
  }
  return { model, question: withTempIds(question, `ai-gen-single-${Date.now().toString(36)}`) };
};

export default { generateQuestions, regenerateSingle };
