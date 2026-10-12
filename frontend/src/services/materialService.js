import api from './api';
import { uploadService, getFileExtension } from './uploadService';

export const MATERIAL_EXTENSIONS = ['pdf', 'docx', 'pptx', 'zip', 'rar'];
export const MATERIAL_MAX_SIZE = 50 * 1024 * 1024;

export const materialService = {
  list: async (lessonId) => {
    const response = await api.get(`/lessons/${lessonId}/materials`);
    return response.data;
  },

  /**
   * 3 bước: xin URL (lesson_material) -> PUT lên S3 -> gắn vào bài học
   */
  upload: async (lessonId, file, title) => {
    const { fileKey } = await uploadService.uploadFile(file, 'lesson_material', lessonId);
    const response = await api.post(`/lessons/${lessonId}/materials`, {
      title: title.trim(),
      fileName: file.name,
      fileKey,
      fileType: getFileExtension(file.name),
      fileSize: file.size
    });
    return response.data;
  },

  rename: async (lessonId, materialId, title) => {
    const response = await api.patch(`/lessons/${lessonId}/materials/${materialId}`, { title: title.trim() });
    return response.data;
  },

  remove: async (lessonId, materialId) => {
    const response = await api.delete(`/lessons/${lessonId}/materials/${materialId}`);
    return response.data;
  },

  getDownloadUrl: async (lessonId, materialId) => {
    const response = await api.get(`/lessons/${lessonId}/materials/${materialId}/download-url`);
    return response.data;
  }
};

export default materialService;
