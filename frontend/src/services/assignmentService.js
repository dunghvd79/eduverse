import api from './api';
import { contentTypeOf, putToS3 } from './uploadService';

export const SUBMISSION_STATUS = {
  submitted: ['Đã nộp', 'blue'],
  late_submitted: ['Nộp muộn', 'orange'],
  graded: ['Đã chấm', 'green'],
  resubmission_requested: ['Yêu cầu nộp lại', 'red'],
  missing: ['Chưa nộp', 'gray']
};

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const classBase = (classId, assignmentId) => `/classes/${classId}/assignments/${assignmentId}`;

export const assignmentService = {
  // Khung bài tập
  list: async (params = {}) => (await api.get('/assignments', { params })).data,
  get: async (id) => (await api.get(`/assignments/${id}`)).data,
  create: async (payload) => (await api.post('/assignments', payload)).data,
  update: async (id, payload) => (await api.patch(`/assignments/${id}`, payload)).data,
  remove: async (id) => (await api.delete(`/assignments/${id}`)).data,

  // Bài tập của lớp
  classAssignments: async (classId) => (await api.get(`/classes/${classId}/assignments`)).data,
  classAssignment: async (classId, assignmentId) => (await api.get(classBase(classId, assignmentId))).data,
  schedule: async (classId, assignmentId, payload) => (await api.put(`${classBase(classId, assignmentId)}/schedule`, payload)).data,

  // Nộp bài: xin URL -> PUT lên S3 -> xác nhận
  submit: async (classId, assignmentId, file, studentNote) => {
    const contentType = contentTypeOf(file);
    const { uploadUrl, fileKey } = (await api.post(`${classBase(classId, assignmentId)}/submissions/presigned-url`, {
      fileName: file.name, fileSize: file.size, contentType
    })).data;
    await putToS3(uploadUrl, file, contentType);
    const response = await api.post(`${classBase(classId, assignmentId)}/submissions`, {
      fileKey, fileName: file.name, fileSize: file.size, ...(studentNote?.trim() ? { studentNote: studentNote.trim() } : {})
    });
    return { ...response.data, message: response.message };
  },
  mySubmission: async (classId, assignmentId) => (await api.get(`${classBase(classId, assignmentId)}/my-submission`)).data,

  // Chấm bài
  submissions: async (classId, assignmentId, params = {}) => (await api.get(`${classBase(classId, assignmentId)}/submissions`, { params })).data,
  submission: async (id) => (await api.get(`/assignment-submissions/${id}`)).data,
  grade: async (id, payload) => (await api.patch(`/assignment-submissions/${id}/grade`, payload)).data,
  requestResubmission: async (id, reason) => (await api.post(`/assignment-submissions/${id}/request-resubmission`, { reason })).data,
  bulkGrade: async (classId, assignmentId, grades) => (await api.patch(`${classBase(classId, assignmentId)}/submissions/bulk-grade`, { grades })).data,
  downloadAll: async (classId, assignmentId) => {
    const response = await api.get(`${classBase(classId, assignmentId)}/submissions/download-all`);
    return { ...response.data, httpStatus: response.statusCode };
  },
  downloadAllStatus: async (classId, assignmentId, jobId) =>
    (await api.get(`${classBase(classId, assignmentId)}/submissions/download-all/status`, { params: { jobId } })).data
};

export default assignmentService;
