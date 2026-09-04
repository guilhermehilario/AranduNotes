import { api } from "../../../core/api/client";
import type { Attachment, AttachmentWithData } from "../types";

export const attachmentService = {
  async upload(
    leafId: string,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<Attachment> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<Attachment>(
      `/leaves/${leafId}/attachments`,
      formData,
      {
        timeout: 120_000,
        onUploadProgress: (e) => {
          if (onProgress && e.total) {
            onProgress(Math.round((e.loaded * 100) / e.total));
          }
        },
      },
    );
    return response.data;
  },

  async list(leafId: string): Promise<Attachment[]> {
    const response = await api.get<Attachment[]>(
      `/leaves/${leafId}/attachments`,
    );
    return response.data;
  },

  async getOne(leafId: string, attachmentId: string): Promise<AttachmentWithData> {
    const response = await api.get<AttachmentWithData>(
      `/leaves/${leafId}/attachments/${attachmentId}`,
    );
    return response.data;
  },

  async remove(attachmentId: string): Promise<{ success: boolean }> {
    const response = await api.delete<{ success: boolean }>(
      `/attachments/${attachmentId}`,
    );
    return response.data;
  },
};

export default attachmentService;
