import api from './api';

const MATERIAL_CONTENT_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip'
};

export const courseMaterialService = {
  getLessonMaterials: async (lessonId) => {
    const response = await api.get(`/lessons/${lessonId}/materials`);
    return response.data;
  },

  uploadLessonMaterial: async (lessonId, file, title) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const contentType = MATERIAL_CONTENT_TYPES[extension] || file.type;
    const presignResponse = await api.post('/uploads/presign', {
      purpose: 'course-material',
      fileName: file.name,
      contentType,
      fileSize: file.size
    });
    const upload = presignResponse.data;
    const s3Response = await fetch(upload.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file
    });
    if (!s3Response.ok) {
      throw new Error(`Tải tệp lên S3 thất bại (HTTP ${s3Response.status}).`);
    }

    const response = await api.post(`/lessons/${lessonId}/materials`, {
      title: title.trim(),
      fileName: file.name,
      fileKey: upload.key,
      fileSize: file.size
    });
    return response.data;
  },

  updateLessonMaterial: async (lessonId, materialId, title) => {
    const response = await api.patch(`/lessons/${lessonId}/materials/${materialId}`, { title });
    return response.data;
  },

  deleteLessonMaterial: async (lessonId, materialId) => {
    const response = await api.delete(`/lessons/${lessonId}/materials/${materialId}`);
    return response.data;
  },

  getDownloadUrl: async (lessonId, materialId) => {
    const response = await api.get(`/lessons/${lessonId}/materials/${materialId}/download-url`);
    return response.data;
  }
};

export default courseMaterialService;
