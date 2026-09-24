# 📝 Đặc Tả API: Module Bài Kiểm Tra & Chấm Tự Động — api-quizzes.md

> **Tài liệu tham chiếu:** [`api-conventions.md`](api-conventions.md), [`schema.md`](../database/schema.md), [`seq-quiz-001.md`](../sequences/seq-quiz-001.md), [`seq-ai-001.md`](../sequences/seq-ai-001.md), [`actor-teacher.md`](../use-cases/actor-teacher.md#uc-ai-001)  
> **Base Path:** `/api/v1/quizzes`, `/api/v1/questions`, `/api/v1/quiz-attempts`, `/api/v1/ai`  
> **Mục đích:** Đặc tả chi tiết toàn bộ các endpoint phục vụ soạn thảo đề thi trắc nghiệm, quản lý ngân hàng câu hỏi, tích hợp Google Gemini AI tự động sinh đề thi từ tài liệu bài giảng, thực hiện bài kiểm tra có tính giờ trên Server (Server Authority), tự động nộp bài khi hết giờ và chấm điểm tự động (Auto Grading).

---

## 1. Danh Sách Endpoint Tổng Quan

### 1.1. Phân hệ Quản lý Đề thi (Quiz Management - Giảng viên & Quản trị)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/quizzes` | `[Authenticated]` | Lấy danh sách đề thi (phân trang, lọc theo khóa học/bài học, phân quyền hiển thị) |
| `GET` | `/api/v1/quizzes/:id` | `[Authenticated]` | Xem cấu hình chi tiết bài kiểm tra (thời lượng, số lượt làm, điểm đạt) |
| `POST` | `/api/v1/quizzes` | `[Roles: teacher, admin]` | Tạo bài kiểm tra trắc nghiệm mới |
| `PATCH` | `/api/v1/quizzes/:id` | `[Roles: teacher, admin]` | Cập nhật cấu hình đề thi (thời gian, điểm đạt, xem đáp án sau khi nộp) |
| `DELETE` | `/api/v1/quizzes/:id` | `[Roles: teacher, admin]` | Xóa mềm bài kiểm tra |

### 1.2. Phân hệ Quản lý Câu hỏi & Đáp án (Questions & Options - Giảng viên)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `GET` | `/api/v1/quizzes/:quizId/questions` | `[Roles: teacher, admin]` | Xem toàn bộ câu hỏi và đáp án đúng để chỉnh sửa |
| `POST` | `/api/v1/quizzes/:quizId/questions` | `[Roles: teacher, admin]` | Thêm một câu hỏi đơn lẻ kèm các lựa chọn đáp án |
| `POST` | `/api/v1/quizzes/:quizId/questions/bulk` | `[Roles: teacher, admin]` | Thêm hàng loạt câu hỏi (kết nối trực tiếp với kết quả từ Gemini AI) |
| `PATCH` | `/api/v1/quizzes/:quizId/questions/reorder` | `[Roles: teacher, admin]` | Cập nhật lại thứ tự hiển thị các câu hỏi trong đề thi (kéo thả UI) |
| `PATCH` | `/api/v1/quizzes/:quizId/questions/bulk` | `[Roles: teacher, admin]` | Cập nhật hàng loạt câu hỏi (sửa nhiều câu hoặc gán điểm chung) |
| `DELETE` | `/api/v1/quizzes/:quizId/questions/bulk` | `[Roles: teacher, admin]` | Xóa hàng loạt câu hỏi được chọn khỏi bài kiểm tra |
| `PATCH` | `/api/v1/questions/:id` | `[Roles: teacher, admin]` | Cập nhật nội dung câu hỏi, điểm số, hoặc các lựa chọn |
| `DELETE` | `/api/v1/questions/:id` | `[Roles: teacher, admin]` | Xóa câu hỏi khỏi bài kiểm tra |

### 1.3. Phân hệ Làm bài thi & Chấm điểm (Student Quiz Attempt & Auto Grading)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `POST` | `/api/v1/quizzes/:id/attempts` | `[Roles: student]` | Bắt đầu làm bài thi (hỗ trợ `classId`, sinh attempt, ẩn `isCorrect`, tính giờ server) |
| `POST` | `/api/v1/quiz-attempts/:attemptId/submit` | `[Roles: student]` | Nộp bài thi (hỗ trợ mảng đáp án multi-choice, chấm điểm tự động thang 10) |
| `GET` | `/api/v1/quizzes/:id/my-attempts` | `[Roles: student]` | Xem lịch sử các lần thi cá nhân đối với đề thi này |
| `GET` | `/api/v1/quiz-attempts/:attemptId` | `[Authenticated]` | Xem lại chi tiết bài làm đã nộp (hiển thị giải thích nếu được phép) |
| `GET` | `/api/v1/quizzes/:id/attempts` | `[Roles: teacher, admin]` | Giảng viên xem danh sách kết quả bài làm của tất cả học viên |

### 1.4. Phân hệ Tích hợp Gemini AI Sinh Đề thi (AI Quiz Generation - UC-AI-001 & SEQ-AI-001)
| Method | Endpoint | Quyền hạn | Mô tả chức năng |
|:---:|---|:---:|---|
| `POST` | `/api/v1/ai/generate-questions` | `[Roles: teacher, admin]` | Gửi văn bản tài liệu/bài giảng, Gemini AI sinh danh sách câu hỏi xem trước (Preview) |
| `POST` | `/api/v1/ai/regenerate-single` | `[Roles: teacher, admin]` | Yêu cầu Gemini AI sinh lại duy nhất 1 câu hỏi thay thế khi chưa ưng ý |

---

## 2. Đặc Tả Chi Tiết Từng Endpoint

### 2.1. Lấy danh sách đề thi

#### `GET /api/v1/quizzes`
* **Mô tả chức năng:** Trả về danh sách bài kiểm tra trắc nghiệm, có phân trang và lọc theo khóa học hoặc bài học.
  * Với Học viên (`student`): Chỉ trả về các đề thi đã công khai (`isPublished = true`).
  * Với Giảng viên & Quản trị: Trả về toàn bộ đề thi (cả nháp và đã xuất bản) do mình phụ trách hoặc toàn trường.
* **Quyền hạn:** `[Authenticated]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Query Parameters:**
  * `page` *(number, default: 1)*: Trang hiện tại.
  * `limit` *(number, default: 10, max: 100)*: Số bản ghi mỗi trang.
  * `lessonId` *(string UUID, optional)*: Lọc đề thi thuộc bài học cụ thể.
  * `courseId` *(string UUID, optional)*: Lọc đề thi thuộc khóa học cụ thể.
  * `search` *(string, optional)*: Tìm kiếm theo tiêu đề bài kiểm tra.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách bài kiểm tra thành công",
  "data": {
    "items": [
      {
        "id": "q1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
        "title": "Kiểm tra kiến thức TypeScript & NestJS cơ bản",
        "durationMinutes": 15,
        "maxAttempts": 3,
        "passScore": "6.0",
        "totalQuestions": 10,
        "isPublished": true,
        "createdAt": "2026-09-22T09:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalItems": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  },
  "timestamp": "2026-09-24T13:50:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |

---

### 2.2. Xem thông tin cấu hình chi tiết bài kiểm tra

#### `GET /api/v1/quizzes/:id`
* **Mô tả chức năng:** Xem thông tin tổng quan của đề thi trước khi học viên nhấn "Bắt đầu làm bài" (hiển thị thời lượng, số lượt thi tối đa, điểm đạt, số câu hỏi).
* **Quyền hạn:** `[Authenticated]`
* **Path Parameters:** `id` (UUID bài kiểm tra)

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy thông tin bài kiểm tra thành công",
  "data": {
    "id": "q1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "title": "Kiểm tra kiến thức TypeScript & NestJS cơ bản",
    "description": "Bài thi gồm 10 câu trắc nghiệm 4 lựa chọn, thời gian 15 phút. Bạn có tối đa 3 lần làm bài.",
    "durationMinutes": 15,
    "maxAttempts": 3,
    "passScore": "6.0",
    "showAnswersAfterSubmit": true,
    "totalQuestions": 10,
    "userAttemptsCount": 1,
    "remainingAttempts": 2,
    "isAvailable": true
  },
  "timestamp": "2026-09-24T13:52:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `404` | `Not Found` | Không tìm thấy bài kiểm tra | ID không tồn tại hoặc đã bị xóa |

---

### 2.3. Tạo bài kiểm tra mới

#### `POST /api/v1/quizzes`
* **Mô tả chức năng:** Giảng viên tạo khung bài kiểm tra mới và gắn vào một bài học trong khóa học.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`CreateQuizDto`):
```json
{
  "lessonId": "l4a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
  "title": "Kiểm tra kiến thức TypeScript & NestJS cơ bản",
  "description": "Bài thi trắc nghiệm đánh giá kiến thức sau chương 2.",
  "durationMinutes": 15,
  "maxAttempts": 3,
  "passScore": 6.0,
  "showAnswersAfterSubmit": true
}
```
* **Validation Rules:**
  * `lessonId`: Bắt buộc, UUID bài học hợp lệ (loại `lessonType: quiz`).
  * `title`: Bắt buộc, độ dài từ 5 đến 255 ký tự.
  * `durationMinutes`: Bắt buộc, số nguyên dương từ 5 đến 180 phút.
  * `maxAttempts`: Bắt buộc, số nguyên dương từ 1 đến 10 lần.
  * `passScore`: Bắt buộc, số thực từ 1.0 đến 10.0 (thang điểm 10).
  * `showAnswersAfterSubmit`: Boolean, mặc định `true`.

#### Response Thành Công (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Tạo bài kiểm tra thành công",
  "data": {
    "id": "q1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "title": "Kiểm tra kiến thức TypeScript & NestJS cơ bản",
    "durationMinutes": 15,
    "maxAttempts": 3,
    "passScore": "6.0",
    "createdAt": "2026-09-24T13:55:00.000Z"
  },
  "timestamp": "2026-09-24T13:55:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Dữ liệu đầu vào không hợp lệ | Thời lượng thi hoặc điểm đạt nằm ngoài giới hạn |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền tạo bài kiểm tra | Không phải giảng viên phụ trách khóa học |
| `404` | `Not Found` | Không tìm thấy bài học liên kết | `lessonId` không tồn tại |

---

### 2.4. Cập nhật cấu hình bài kiểm tra

#### `PATCH /api/v1/quizzes/:id`
* **Mô tả chức năng:** Cập nhật thông tin tiêu đề, thời lượng thi, số lần làm tối đa, điểm đạt hoặc bật/tắt quyền xem đáp án sau khi nộp.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `id` *(string UUID, required)*: ID bài kiểm tra cần cập nhật.

#### Request Body (`UpdateQuizDto`):
```json
{
  "title": "Kiểm tra kiến thức NestJS (Mở rộng)",
  "durationMinutes": 20,
  "showAnswersAfterSubmit": false
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật bài kiểm tra thành công",
  "data": {
    "id": "q1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "title": "Kiểm tra kiến thức NestJS (Mở rộng)",
    "durationMinutes": 20,
    "showAnswersAfterSubmit": false,
    "updatedAt": "2026-09-24T13:57:00.000Z"
  },
  "timestamp": "2026-09-24T13:57:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền sửa bài kiểm tra | Không phải giảng viên phụ trách |
| `404` | `Not Found` | Không tìm thấy bài kiểm tra | ID không tồn tại |

---

### 2.5. Xóa bài kiểm tra

#### `DELETE /api/v1/quizzes/:id`
* **Mô tả chức năng:** Xóa mềm bài kiểm tra (`deleted_at = now()`).
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `id` *(string UUID, required)*: ID bài kiểm tra cần xóa.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Xóa bài kiểm tra thành công",
  "data": null,
  "timestamp": "2026-09-24T13:58:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền xóa bài kiểm tra | Không phải giảng viên phụ trách |
| `404` | `Not Found` | Không tìm thấy bài kiểm tra | ID không tồn tại |

---

### 2.6. Giảng viên xem danh sách câu hỏi kèm đáp án đúng

#### `GET /api/v1/quizzes/:quizId/questions`
* **Mô tả chức năng:** Giảng viên phụ trách xem toàn bộ câu hỏi và các lựa chọn đáp án (có hiển thị rõ `isCorrect: true/false` và lời giải thích `explanation`) để chỉnh sửa nội dung đề thi.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `quizId` *(string UUID, required)*: ID bài kiểm tra cần xem câu hỏi.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách câu hỏi đề thi thành công",
  "data": [
    {
      "id": "qs1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "content": "Trong NestJS, Decorator nào được sử dụng để định nghĩa một Controller?",
      "questionType": "single_choice",
      "points": 1,
      "explanation": "@Controller() được sử dụng để khai báo controller class.",
      "orderIndex": 1,
      "choices": [
        { "id": "ch1", "content": "@Injectable()", "isCorrect": false },
        { "id": "ch2", "content": "@Controller()", "isCorrect": true },
        { "id": "ch3", "content": "@Module()", "isCorrect": false },
        { "id": "ch4", "content": "@Component()", "isCorrect": false }
      ]
    }
  ],
  "timestamp": "2026-09-24T13:59:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền xem câu hỏi | Học viên không được phép gọi API này |
| `404` | `Not Found` | Không tìm thấy đề thi | `quizId` không tồn tại |

---

### 2.7. Thêm một câu hỏi đơn lẻ kèm các lựa chọn

#### `POST /api/v1/quizzes/:quizId/questions`
* **Mô tả chức năng:** Giảng viên thêm một câu hỏi vào đề thi. Mỗi câu hỏi gồm nội dung, điểm số, lời giải thích và danh sách các lựa chọn đáp án (có đánh dấu `isCorrect: true`).
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `quizId` *(string UUID, required)*: ID bài kiểm tra muốn thêm câu hỏi.

#### Request Body (`CreateQuestionDto`):
```json
{
  "content": "Trong NestJS, Decorator nào được sử dụng để định nghĩa một Controller?",
  "questionType": "single_choice",
  "points": 1,
  "explanation": "@Controller() được sử dụng để khai báo một controller class trong NestJS.",
  "orderIndex": 1,
  "choices": [
    { "content": "@Injectable()", "isCorrect": false },
    { "content": "@Controller()", "isCorrect": true },
    { "content": "@Module()", "isCorrect": false },
    { "content": "@Component()", "isCorrect": false }
  ]
}
```
* **Validation Rules:**
  * `content`: Bắt buộc, chuỗi văn bản câu hỏi.
  * `questionType`: Chỉ nhận `single_choice`, `multiple_choice`, hoặc `true_false`.
  * `points`: Số dương, mặc định `1`.
  * `choices`: Mảng từ 2 đến 6 lựa chọn, **bắt buộc phải có ít nhất 1 đáp án `isCorrect: true`**.

#### Response Thành Công (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Thêm câu hỏi thành công",
  "data": {
    "id": "qs1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "quizId": "q1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "content": "Trong NestJS, Decorator nào được sử dụng để định nghĩa một Controller?",
    "points": 1,
    "choicesCount": 4,
    "createdAt": "2026-09-24T14:00:00.000Z"
  },
  "timestamp": "2026-09-24T14:00:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Câu hỏi phải có ít nhất một đáp án đúng | Không có choice nào có `isCorrect = true` |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền sửa bài kiểm tra này | Không phải giảng viên phụ trách |
| `404` | `Not Found` | Không tìm thấy đề thi | `quizId` không tồn tại |

---

### 2.8. Thêm hàng loạt câu hỏi vào đề thi (Bulk Insert)

#### `POST /api/v1/quizzes/:quizId/questions/bulk`
* **Mô tả chức năng:** Thêm danh sách nhiều câu hỏi cùng lúc vào đề thi trong 1 transaction CSDL. Endpoint này **đồng bộ trực tiếp với kết quả sinh từ Google Gemini AI trong [`seq-ai-001`](../sequences/seq-ai-001.md)** sau khi Giảng viên duyệt danh sách xem trước.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `quizId` *(string UUID, required)*: ID bài kiểm tra nhận danh sách câu hỏi.

#### Request Body (`CreateBulkQuestionsDto`):
```json
{
  "questions": [
    {
      "content": "NestJS được xây dựng dựa trên framework nền tảng nào mặc định?",
      "questionType": "single_choice",
      "points": 1,
      "explanation": "Mặc định NestJS sử dụng Express framework làm HTTP server adapter.",
      "choices": [
        { "content": "Express", "isCorrect": true },
        { "content": "Fastify", "isCorrect": false },
        { "content": "Koa", "isCorrect": false },
        { "content": "Hapi", "isCorrect": false }
      ]
    },
    {
      "content": "TypeScript là superset của JavaScript, đúng hay sai?",
      "questionType": "true_false",
      "points": 1,
      "explanation": "TypeScript mở rộng cú pháp của JavaScript bằng cách thêm static typing.",
      "choices": [
        { "content": "Đúng", "isCorrect": true },
        { "content": "Sai", "isCorrect": false }
      ]
    }
  ]
}
```

#### Response Thành Công (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Thêm hàng loạt câu hỏi thành công",
  "data": {
    "quizId": "q1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "insertedCount": 2
  },
  "timestamp": "2026-09-24T14:05:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Dữ liệu mảng câu hỏi không hợp lệ | Một trong các câu hỏi thiếu đáp án đúng |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền sửa đề thi | Không phải giảng viên phụ trách |

---

### 2.9. Cập nhật thứ tự các câu hỏi trong đề thi (Reorder)

#### `PATCH /api/v1/quizzes/:quizId/questions/reorder`
* **Mô tả chức năng:** Giảng viên sắp xếp lại thứ tự hiển thị của các câu hỏi trong đề thi (khi sử dụng thao tác kéo thả Drag & Drop trên giao diện).
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `quizId` *(string UUID, required)*: ID bài kiểm tra cần sắp xếp lại câu hỏi.

#### Request Body (`ReorderQuestionsDto`):
```json
{
  "orders": [
    { "id": "qs1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c", "orderIndex": 1 },
    { "id": "qs2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d", "orderIndex": 2 },
    { "id": "qs3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e", "orderIndex": 3 }
  ]
}
```
* **Validation Rules:**
  * `orders`: Bắt buộc, mảng ít nhất 1 phần tử.
  * Mỗi phần tử phải có `id` (UUID câu hỏi) và `orderIndex` (số nguyên dương >= 1).

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật thứ tự câu hỏi thành công",
  "data": {
    "quizId": "q1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "updatedCount": 3
  },
  "timestamp": "2026-09-24T14:42:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Dữ liệu sắp xếp không hợp lệ | ID câu hỏi trùng lặp hoặc orderIndex không hợp lệ |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền sửa bài kiểm tra này | Không phải giảng viên phụ trách |
| `404` | `Not Found` | Không tìm thấy đề thi hoặc câu hỏi | `quizId` hoặc câu hỏi không tồn tại trong đề thi |

---

### 2.10. Cập nhật hàng loạt câu hỏi trong đề thi (Bulk Update)

#### `PATCH /api/v1/quizzes/:quizId/questions/bulk`
* **Mô tả chức năng:** Giảng viên cập nhật nhiều câu hỏi cùng lúc trong một Transaction CSDL duy nhất. Hỗ trợ 2 kịch bản nghiệp vụ:
  1. `details`: Cập nhật nội dung, điểm số, hoặc các lựa chọn cho nhiều câu hỏi khác nhau (ví dụ: sau khi chỉnh sửa trên giao diện bảng Grid / Table).
  2. `common_points`: Gán nhanh một mức điểm chung (`commonPoints`) cho danh sách nhiều câu hỏi được chọn (ví dụ: tick chọn 10 câu và gán đồng loạt 2.0 điểm).
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `quizId` *(string UUID, required)*: ID bài kiểm tra cần cập nhật câu hỏi.

#### Request Body (`BulkUpdateQuestionsDto`):

##### Kịch bản 1: Sửa chi tiết từng câu (`mode: "details"`)
```json
{
  "mode": "details",
  "questions": [
    {
      "id": "qs1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "points": 2.0,
      "content": "Trong NestJS, Decorator nào được sử dụng để định nghĩa Controller?",
      "explanation": "@Controller() được sử dụng để khai báo controller class.",
      "choices": [
        { "id": "ch1", "content": "@Injectable()", "isCorrect": false },
        { "id": "ch2", "content": "@Controller()", "isCorrect": true }
      ]
    },
    {
      "id": "qs2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
      "points": 1.5
    }
  ]
}
```

##### Kịch bản 2: Gán điểm chung cho các câu đã chọn (`mode: "common_points"`)
```json
{
  "mode": "common_points",
  "questionIds": [
    "qs1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "qs2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
  ],
  "commonPoints": 2.0
}
```

* **Validation Rules:**
  * `mode`: Tùy chọn, enum nhận `details` hoặc `common_points` (mặc định: `details`).
  * Với `mode = details`:
    * `questions`: Bắt buộc, mảng từ 1 đến 50 phần tử.
    * Mỗi phần tử phải có `id` (UUID câu hỏi hợp lệ trong bài thi) và ít nhất một trường cần cập nhật (`points`, `content`, `explanation`, `choices`).
  * Với `mode = common_points`:
    * `questionIds`: Bắt buộc, mảng từ 1 đến 50 UUID câu hỏi.
    * `commonPoints`: Bắt buộc, số dương > 0 (thang điểm câu hỏi).

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật hàng loạt câu hỏi thành công",
  "data": {
    "quizId": "q1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "updatedCount": 2
  },
  "timestamp": "2026-09-24T14:42:30.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Dữ liệu cập nhật không hợp lệ | Mảng rỗng, ID sai định dạng, hoặc commonPoints <= 0 |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền sửa bài kiểm tra này | Không phải giảng viên phụ trách |
| `404` | `Not Found` | Không tìm thấy đề thi hoặc câu hỏi | `quizId` hoặc câu hỏi không tồn tại trong đề thi |

---

### 2.11. Xóa hàng loạt câu hỏi khỏi bài kiểm tra (Bulk Delete)

#### `DELETE /api/v1/quizzes/:quizId/questions/bulk`
* **Mô tả chức năng:** Giảng viên xóa cùng lúc nhiều câu hỏi được chọn khỏi bài kiểm tra trong một transaction CSDL. Hệ thống tự động xóa cascade toàn bộ các choices liên quan.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `quizId` *(string UUID, required)*: ID bài kiểm tra.

#### Request Body (`BulkDeleteQuestionsDto`):
```json
{
  "questionIds": [
    "qs1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "qs2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
  ]
}
```
* **Validation Rules:**
  * `questionIds`: Bắt buộc, mảng chứa từ 1 đến 50 UUID câu hỏi hợp lệ cần xóa.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Xóa hàng loạt câu hỏi thành công",
  "data": {
    "quizId": "q1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "deletedCount": 2
  },
  "timestamp": "2026-09-24T14:43:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Danh sách câu hỏi cần xóa không hợp lệ | Mảng `questionIds` rỗng hoặc chứa UUID sai định dạng |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền sửa bài kiểm tra này | Không phải giảng viên phụ trách |
| `404` | `Not Found` | Không tìm thấy đề thi | `quizId` không tồn tại |

---

### 2.12. Cập nhật câu hỏi và lựa chọn đơn lẻ

#### `PATCH /api/v1/questions/:id`
* **Mô tả chức năng:** Giảng viên cập nhật nội dung câu hỏi, điểm số, lời giải thích hoặc các lựa chọn đáp án của câu hỏi đã có trong bài kiểm tra.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `id` *(string UUID, required)*: ID câu hỏi cần cập nhật.

#### Request Body (`UpdateQuestionDto`):
```json
{
  "content": "Trong NestJS, Decorator nào được sử dụng để định nghĩa một Controller?",
  "points": 2,
  "explanation": "@Controller() được sử dụng để khai báo một controller class tiếp nhận request.",
  "choices": [
    { "id": "ch1", "content": "@Injectable()", "isCorrect": false },
    { "id": "ch2", "content": "@Controller()", "isCorrect": true },
    { "content": "@Service()", "isCorrect": false }
  ]
}
```
* **Validation Rules:**
  * `content`: Tùy chọn, chuỗi văn bản không được rỗng nếu truyền.
  * `points`: Tùy chọn, số dương > 0.
  * `explanation`: Tùy chọn, chuỗi văn bản giải thích.
  * `choices`: Tùy chọn. Nếu truyền, phải có từ 2 đến 6 lựa chọn và **bắt buộc có ít nhất 1 lựa chọn có `isCorrect: true`**. Lựa chọn có `id` hợp lệ sẽ được cập nhật, lựa chọn không có `id` sẽ được thêm mới, các lựa chọn cũ trong DB không nằm trong danh sách sẽ bị xóa (replace update).

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật câu hỏi thành công",
  "data": {
    "id": "qs1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "quizId": "q1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
    "content": "Trong NestJS, Decorator nào được sử dụng để định nghĩa một Controller?",
    "points": 2,
    "explanation": "@Controller() được sử dụng để khai báo một controller class tiếp nhận request.",
    "choices": [
      { "id": "ch1", "content": "@Injectable()", "isCorrect": false },
      { "id": "ch2", "content": "@Controller()", "isCorrect": true },
      { "id": "ch5", "content": "@Service()", "isCorrect": false }
    ],
    "updatedAt": "2026-09-24T14:08:00.000Z"
  },
  "timestamp": "2026-09-24T14:08:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Câu hỏi phải có ít nhất một đáp án đúng | Cập nhật choices nhưng không có lựa chọn nào có `isCorrect = true` |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền sửa câu hỏi này | Không phải giảng viên phụ trách bài kiểm tra này |
| `404` | `Not Found` | Không tìm thấy câu hỏi | `id` không tồn tại |

---

### 2.13. Xóa câu hỏi khỏi bài kiểm tra

#### `DELETE /api/v1/questions/:id`
* **Mô tả chức năng:** Giảng viên xóa một câu hỏi khỏi đề thi. CSDL tự động xóa liên đới (cascade) toàn bộ các lựa chọn (`question_options`) thuộc về câu hỏi này.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `id` *(string UUID, required)*: ID câu hỏi cần xóa.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Xóa câu hỏi thành công",
  "data": null,
  "timestamp": "2026-09-24T14:09:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền xóa câu hỏi này | Không phải giảng viên phụ trách bài kiểm tra này |
| `404` | `Not Found` | Không tìm thấy câu hỏi | `id` không tồn tại |

---

### 2.14. Bắt đầu phiên làm bài thi (Start Attempt)

#### `POST /api/v1/quizzes/:id/attempts`
* **Mô tả chức năng:** Học viên bấm "Bắt đầu làm bài". Hệ thống kiểm tra điều kiện (còn lượt thi, trong khung giờ mở), tạo bản ghi `QuizAttempt` mới với `startedAt = now()`, trạng thái `in_progress`. Trả về danh sách câu hỏi **đã loại bỏ hoàn toàn trường `isCorrect` để chống gian lận F12**.
* **Quyền hạn:** `[Roles: student]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `id` *(string UUID, required)*: ID bài kiểm tra cần bắt đầu thi.
* **Query Parameters:**
  * `classId` *(string UUID, optional)*: ID lớp học học viên đang tham gia. Nếu truyền, hệ thống đối chiếu lịch thi trong bảng `class_quizzes` (`open_time`, `close_time`, `is_active`) và lưu liên kết `class_quiz_id` vào `quiz_attempts`.

#### Request Body: Không có.

#### Response Thành Công (`201 Created`):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Bắt đầu làm bài thi thành công",
  "data": {
    "attemptId": "att1a2b3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "durationMinutes": 15,
    "startedAt": "2026-09-24T14:10:00.000Z",
    "questions": [
      {
        "id": "qs1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "content": "Trong NestJS, Decorator nào được sử dụng để định nghĩa một Controller?",
        "questionType": "single_choice",
        "points": 1,
        "choices": [
          { "id": "ch1", "content": "@Injectable()" },
          { "id": "ch2", "content": "@Controller()" },
          { "id": "ch3", "content": "@Module()" },
          { "id": "ch4", "content": "@Component()" }
        ]
      }
    ]
  },
  "timestamp": "2026-09-24T14:10:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Bài kiểm tra hiện không khả dụng | Đề thi chưa công khai hoặc đã hết thời gian mở |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Bạn đã sử dụng hết số lần làm bài cho phép | Số lần thi đã đạt `maxAttempts` |
| `404` | `Not Found` | Không tìm thấy bài kiểm tra | `id` không tồn tại |

---

### 2.15. Nộp bài thi & Chấm điểm tự động (Submit & Auto Grading)

#### `POST /api/v1/quiz-attempts/:attemptId/submit`
*(Alias hỗ trợ: `POST /api/v1/quizzes/attempts/:attemptId/submit`)*
* **Mô tả chức năng:** Nộp bài thi (khi học viên ấn nộp hoặc đồng hồ frontend đếm về `00:00` tự động nộp). Hệ thống kiểm tra thời gian nộp (cho phép ân hạn mạng 30s), so khớp đáp án với ngân hàng đáp án chuẩn, quy đổi ra thang điểm 10, cập nhật `QuizAttempt` sang `completed` và trả về kết quả ngay lập tức.
* **Quyền hạn:** `[Roles: student]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`
* **Path Parameters:**
  * `attemptId` *(string UUID, required)*: ID phiên làm bài cần nộp.

#### Request Body (`SubmitQuizDto`):
```json
{
  "answers": [
    {
      "questionId": "qs1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "selectedChoiceIds": ["ch2"]
    },
    {
      "questionId": "qs2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
      "selectedChoiceIds": ["ch1", "ch3"]
    }
  ]
}
```
* **Validation Rules:**
  * `answers`: Bắt buộc, mảng câu trả lời của học viên.
  * `questionId`: Bắt buộc, UUID câu hỏi hợp lệ trong đề thi.
  * `selectedChoiceIds`: Bắt buộc, mảng các UUID lựa chọn được tick. Hỗ trợ mảng 1 phần tử cho `single_choice`/`true_false` và nhiều phần tử cho `multiple_choice`.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Nộp bài và chấm điểm tự động thành công!",
  "data": {
    "attemptId": "att1a2b3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "score": "9.0",
    "totalQuestions": 10,
    "correctCount": 9,
    "passed": true,
    "passScore": "6.0",
    "submittedAt": "2026-09-24T14:22:30.000Z"
  },
  "timestamp": "2026-09-24T14:22:30.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Bài thi này đã được nộp trước đó | Phiên làm bài đã kết thúc (`completed`) |
| `400` | `Bad Request` | Đã quá thời gian nộp bài cho phép | Nộp muộn vượt quá thời lượng thi + 30 giây ân hạn |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Phiên thi không thuộc về bạn | Học viên khác cố nộp bài của bạn |
| `404` | `Not Found` | Không tìm thấy phiên làm bài | `attemptId` không tồn tại |

---

### 2.16. Xem lịch sử các lần thi cá nhân

#### `GET /api/v1/quizzes/:id/my-attempts`
* **Mô tả chức năng:** Học viên xem lại danh sách tất cả các lượt làm bài của chính mình trong đề thi này, gồm điểm số, thời gian làm và trạng thái Đạt/Không đạt, hỗ trợ sắp xếp theo điểm số hoặc thời gian nộp bài.
* **Quyền hạn:** `[Roles: student]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `id` *(string UUID, required)*: ID bài kiểm tra.
* **Query Parameters:**
  * `page` *(number, default: 1)*: Trang hiện tại.
  * `limit` *(number, default: 10, max: 50)*: Số bản ghi mỗi trang.
  * `sortBy` *(string, default: `submittedAt`)*: Trường sắp xếp (`score` - theo điểm số, `submittedAt` - theo thời gian nộp bài, `attemptNumber` - theo thứ tự lần thi).
  * `sortOrder` *(string, default: `DESC`)*: Thứ tự sắp xếp (`ASC` - tăng dần, `DESC` - giảm dần).
  * `status` *(string, optional)*: Lọc theo trạng thái lần thi (`completed`, `in_progress`).

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy lịch sử làm bài thi thành công",
  "data": {
    "items": [
      {
        "attemptId": "att1a2b3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "attemptNumber": 2,
        "score": "9.0",
        "passed": true,
        "startedAt": "2026-09-24T14:10:00.000Z",
        "submittedAt": "2026-09-24T14:22:30.000Z",
        "status": "completed"
      },
      {
        "attemptId": "att2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
        "attemptNumber": 1,
        "score": "5.5",
        "passed": false,
        "startedAt": "2026-09-24T13:00:00.000Z",
        "submittedAt": "2026-09-24T13:14:45.000Z",
        "status": "completed"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "totalItems": 2,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  },
  "timestamp": "2026-09-24T14:23:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `404` | `Not Found` | Không tìm thấy đề thi | `id` không tồn tại |

---

### 2.17. Xem lại chi tiết bài làm đã nộp (Review Attempt)

#### `GET /api/v1/quiz-attempts/:attemptId`
*(Alias hỗ trợ: `GET /api/v1/quizzes/attempts/:attemptId`)*
* **Mô tả chức năng:** Xem lại toàn bộ câu hỏi và đáp án học viên đã chọn trong phiên làm bài.
  * Nếu `showAnswersAfterSubmit: true`: Trả về cả đáp án đúng và lời giải thích (`explanation`) cho từng câu.
  * Nếu `showAnswersAfterSubmit: false` và người gọi là Học viên: Ẩn trường đáp án đúng và lời giải thích (chỉ hiển thị lựa chọn học viên đã đánh và tổng điểm).
  * Giảng viên luôn xem được đầy đủ chi tiết đáp án đúng và giải thích.
* **Quyền hạn:** `[Authenticated]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `attemptId` *(string UUID, required)*: ID phiên thi cần xem chi tiết.

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy chi tiết bài làm thành công",
  "data": {
    "attemptId": "att1a2b3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
    "score": "9.0",
    "passed": true,
    "submittedAt": "2026-09-24T14:22:30.000Z",
    "questions": [
      {
        "id": "qs1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "content": "Trong NestJS, Decorator nào được sử dụng để định nghĩa một Controller?",
        "questionType": "single_choice",
        "selectedChoiceIds": ["ch2"],
        "isCorrect": true,
        "correctChoiceIds": ["ch2"],
        "explanation": "@Controller() được sử dụng để khai báo một controller class trong NestJS."
      }
    ]
  },
  "timestamp": "2026-09-24T14:25:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền xem bài làm này | Học viên không sở hữu bài thi này và không phải giảng viên |
| `404` | `Not Found` | Không tìm thấy phiên làm bài | `attemptId` không tồn tại |

---

### 2.18. Giảng viên xem kết quả làm bài của cả lớp

#### `GET /api/v1/quizzes/:id/attempts`
* **Mô tả chức năng:** Giảng viên phụ trách xem danh sách kết quả làm bài của tất cả học viên trong lớp (bảng thống kê điểm số, thời gian nộp, tỉ lệ đạt) để quản lý chất lượng. Hỗ trợ tìm kiếm, lọc theo kết quả đạt/không đạt, và sắp xếp theo điểm số, tên học viên hoặc thời gian nộp bài.
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:** `Authorization: Bearer <access_token>`
* **Path Parameters:**
  * `id` *(string UUID, required)*: ID bài kiểm tra.
* **Query Parameters:**
  * `page` *(number, default: 1)*: Trang hiện tại.
  * `limit` *(number, default: 20, max: 100)*: Số bản ghi mỗi trang.
  * `search` *(string, optional)*: Tìm kiếm theo họ tên hoặc email học viên.
  * `sortBy` *(string, default: `submittedAt`)*: Trường sắp xếp (`score` - điểm số, `studentName` - họ tên học viên, `submittedAt` - thời gian nộp bài).
  * `sortOrder` *(string, default: `DESC`)*: Chiều sắp xếp (`ASC` - tăng dần, `DESC` - giảm dần).
  * `passed` *(boolean, optional)*: Lọc theo kết quả (`true` = Đạt, `false` = Không đạt).
  * `status` *(string, optional)*: Lọc theo trạng thái làm bài (`completed`, `in_progress`).

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách kết quả bài thi thành công",
  "data": {
    "items": [
      {
        "attemptId": "att1a2b3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
        "student": {
          "id": "u1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c",
          "fullName": "Nguyễn Văn A",
          "email": "student@eduverse.edu.vn"
        },
        "score": "9.0",
        "passed": true,
        "submittedAt": "2026-09-24T14:22:30.000Z",
        "status": "completed"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "totalItems": 35,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "timestamp": "2026-09-24T14:26:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền xem kết quả | Không phải giảng viên phụ trách |
| `404` | `Not Found` | Không tìm thấy đề thi | `id` không tồn tại |

---

### 2.19. Sinh danh sách câu hỏi trắc nghiệm bằng Gemini AI

#### `POST /api/v1/ai/generate-questions`
* **Mô tả chức năng:** Giảng viên cung cấp đoạn văn bản tài liệu bài giảng/giáo trình, cấu hình số lượng câu hỏi và độ khó. Hệ thống gửi Structured Prompt tới Google Gemini API (Gemini 1.5/2.0 Flash) ép cấu trúc JSON Schema, tự động phân tích ngữ nghĩa và sinh danh sách câu hỏi xem trước (Preview) gồm nội dung, 4 đáp án lựa chọn, đáp án chính xác và lời giải thích chi tiết ([`UC-AI-001`](../use-cases/actor-teacher.md#uc-ai-001) & [`SEQ-AI-001`](../sequences/seq-ai-001.md)).
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`GenerateAiQuestionsDto`):
```json
{
  "documentText": "TypeScript là một ngôn ngữ lập trình mã nguồn mở được phát triển bởi Microsoft. Nó là một superset cú pháp nghiêm ngặt của JavaScript và bổ sung tùy chọn kiểu tĩnh (static typing). NestJS là framework Node.js tiến bộ xây dựng ứng dụng phía server hiệu quả và dễ mở rộng, sử dụng TypeScript hiện đại theo mặc định và kết hợp OOP, FP và FRP...",
  "numQuestions": 5,
  "difficulty": "medium",
  "questionType": "single_choice"
}
```
* **Validation Rules:**
  * `documentText`: Bắt buộc, chuỗi văn bản tài liệu tối thiểu 100 từ (khoảng 300 ký tự) để AI có đủ dữ kiện trích xuất câu hỏi.
  * `numQuestions`: Số nguyên từ 1 đến 20 (mặc định: 5).
  * `difficulty`: Enum nhận `easy`, `medium`, `hard` (mặc định: `medium`).
  * `questionType`: Enum nhận `single_choice`, `multiple_choice`, `true_false` hoặc `mixed` (mặc định: `single_choice`).

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "AI sinh danh sách câu hỏi thành công",
  "data": {
    "totalGenerated": 2,
    "questions": [
      {
        "tempId": "ai-gen-1",
        "content": "TypeScript bổ sung tính năng cốt lõi nào cho JavaScript?",
        "questionType": "single_choice",
        "points": 1,
        "explanation": "TypeScript là superset của JavaScript bổ sung static typing (kiểu dữ liệu tĩnh).",
        "choices": [
          { "tempId": "opt-1", "content": "Static typing (kiểu tĩnh tùy chọn)", "isCorrect": true },
          { "tempId": "opt-2", "content": "Tự động quản lý bộ nhớ RAM cấp thấp", "isCorrect": false },
          { "tempId": "opt-3", "content": "Biên dịch trực tiếp ra mã máy Assembly", "isCorrect": false },
          { "tempId": "opt-4", "content": "Thay thế hoàn toàn động cơ V8 của Node.js", "isCorrect": false }
        ]
      },
      {
        "tempId": "ai-gen-2",
        "content": "NestJS hỗ trợ các mô hình lập trình nào sau đây?",
        "questionType": "single_choice",
        "points": 1,
        "explanation": "NestJS kết hợp OOP (Lập trình hướng đối tượng), FP (Lập trình hàm) và FRP (Lập trình phản ứng hàm).",
        "choices": [
          { "tempId": "opt-1", "content": "OOP, FP và FRP", "isCorrect": true },
          { "tempId": "opt-2", "content": "Chỉ duy nhất mô hình thủ tục Procedural", "isCorrect": false },
          { "tempId": "opt-3", "content": "Chỉ hướng sự kiện không có hướng đối tượng", "isCorrect": false },
          { "tempId": "opt-4", "content": "Chỉ hướng khía cạnh AOP", "isCorrect": false }
        ]
      }
    ]
  },
  "timestamp": "2026-09-24T14:30:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Văn bản nguồn quá ngắn (dưới 100 từ) | Cung cấp tài liệu không đủ dữ kiện trích xuất |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền sử dụng tính năng AI | Học viên không được phép tạo câu hỏi |
| `429` | `Too Many Requests` | Vượt quá giới hạn gọi AI | Hết Quota API Key Gemini trong phút/ngày |
| `502` | `Bad Gateway` | Phản hồi từ AI không đúng cấu trúc | Gemini trả về JSON sai cú pháp |
| `503` | `Service Unavailable` | Dịch vụ AI đang bận hoặc timeout | Không thể kết nối Google Gemini API |

---

### 2.20. Sinh lại một câu hỏi trắc nghiệm đơn lẻ bằng Gemini AI

#### `POST /api/v1/ai/regenerate-single`
* **Mô tả chức năng:** Trong màn hình xem trước (Preview), nếu giảng viên không ưng ý một câu hỏi cụ thể, bấm nút "Tạo lại câu này". Hệ thống gửi lại ngữ cảnh tài liệu kèm nội dung câu hỏi cũ để AI sinh một câu hỏi thay thế hoàn toàn mới ([`SEQ-AI-001`](../sequences/seq-ai-001.md) — Bước 84–92).
* **Quyền hạn:** `[Roles: teacher, admin]`
* **Headers:**
  * `Authorization: Bearer <access_token>`
  * `Content-Type: application/json`

#### Request Body (`RegenerateSingleAiQuestionDto`):
```json
{
  "documentText": "TypeScript là một ngôn ngữ lập trình mã nguồn mở...",
  "previousQuestionPrompt": "TypeScript bổ sung tính năng cốt lõi nào cho JavaScript?",
  "difficulty": "medium",
  "questionType": "single_choice"
}
```

#### Response Thành Công (`200 OK`):
```json
{
  "success": true,
  "statusCode": 200,
  "message": "AI sinh lại câu hỏi thay thế thành công",
  "data": {
    "question": {
      "tempId": "ai-gen-single-new",
      "content": "Framework nào thường được kết hợp với NestJS làm HTTP Server Adapter mặc định?",
      "questionType": "single_choice",
      "points": 1,
      "explanation": "NestJS mặc định sử dụng Express làm nền tảng HTTP Server Adapter.",
      "choices": [
        { "tempId": "opt-1", "content": "Express", "isCorrect": true },
        { "tempId": "opt-2", "content": "Koa", "isCorrect": false },
        { "tempId": "opt-3", "content": "Fastify", "isCorrect": false },
        { "tempId": "opt-4", "content": "Hapi", "isCorrect": false }
      ]
    }
  },
  "timestamp": "2026-09-24T14:32:00.000Z"
}
```

#### Các lỗi thường gặp:
| HTTP Code | Error | Message | Nguyên nhân |
|:---:|---|---|---|
| `400` | `Bad Request` | Dữ liệu đầu vào không hợp lệ | Thiếu nội dung tài liệu hoặc câu hỏi cũ |
| `401` | `Unauthorized` | Chưa đăng nhập | Access Token thiếu hoặc hết hạn |
| `403` | `Forbidden` | Không có quyền sử dụng tính năng AI | Học viên không có quyền gọi |
| `429` | `Too Many Requests` | Vượt quá giới hạn gọi AI | Quá số lượt gọi trong 1 phút |
| `502` | `Bad Gateway` | Phản hồi từ AI không đúng cấu trúc | Lỗi parse JSON |

---

## 3. Ghi Chú Kỹ Thuật & Nghiệp Vụ Module Quizzes

- **Bảo mật Anti-Cheat (Chống gian lận tuyệt đối):**
  - **Lọc Payload (Sanitize Response):** Khi gọi `POST /attempts` để bắt đầu thi, tầng Service bắt buộc loại bỏ trường `is_correct` khỏi tất cả các bản ghi `question_options` trước khi trả về client. Học viên mở F12 Inspect Element / Network Tab sẽ không thể xem được đáp án đúng.
  - **Server-side Time Authority (Quyền lực thời gian trên Server):** Thời gian thi được tính bằng công thức: `now <= started_at + duration_minutes * 60 + grace_period (30s)`. Tuyệt đối không tin tưởng đồng hồ máy tính của học viên.
- **Tự động nộp bài khi hết giờ (Auto-submit on Timeout):**
  - Trình duyệt đếm ngược về `00:00` sẽ tự động kích hoạt gửi request `POST /quiz-attempts/:attemptId/submit`. Nếu học viên cố tình tắt mạng hoặc tắt máy tính, hệ thống có thể chạy một Cron Job nền (BullMQ Queue) để tự động khóa và chấm các câu đã lưu tạm.
- **Công thức tính điểm chuẩn (Thang điểm 10, làm tròn 2 chữ số thập phân):**
  $$\text{Điểm chưa làm tròn} = \left( \frac{\sum \text{Điểm câu trả lời đúng}}{\sum \text{Tổng điểm tối đa của đề thi}} \right) \times 10$$
  $$\text{Score} = \text{ROUND}(\text{Điểm chưa làm tròn}, \; 2)$$
  *(Trong đó: $\times 10$ là quy đổi về thang điểm 10, còn số $2$ trong hàm $\text{ROUND}(\dots, 2)$ là làm tròn đến 2 chữ số sau dấu phẩy, ví dụ: $8.3333 \dots \rightarrow 8.33$)*.
  - Với câu hỏi `single_choice` và `true_false`: Học viên chọn đúng đáp án duy nhất có `isCorrect = true` $\rightarrow$ nhận trọn điểm của câu hỏi (`points`).
  - Với câu hỏi `multiple_choice`: Học viên phải chọn **đúng và đủ** toàn bộ các đáp án đúng (tập hợp các lựa chọn đã chọn phải khớp 100% với tập hợp các lựa chọn có `isCorrect = true`) $\rightarrow$ nhận trọn điểm của câu. Trường hợp chọn thiếu hoặc chọn trúng đáp án sai $\rightarrow$ tính 0 điểm câu đó.
- **Độ tin cậy phía Client (Offline Resilience):**
  - Trong quá trình làm bài kéo dài, giao diện Frontend (React) tự động đồng bộ trạng thái các câu đã tick vào `LocalStorage`. Khi có sự cố refresh trình duyệt, học viên có thể tải lại trang làm bài mà không mất tiến trình. Toàn bộ mảng câu trả lời `answers` chỉ được gửi lên Server khi bấm Nộp bài.
- **Hiệu năng Chấm điểm & Caching (Redis):**
  - Bộ đáp án chuẩn của đề thi (`answerKeys`) nên được lưu cache trong **Redis** trong thời gian diễn ra bài thi để tránh việc truy vấn nhiều lần vào PostgreSQL khi hàng trăm học viên cùng nộp bài một lúc.
