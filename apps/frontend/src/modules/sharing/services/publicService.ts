import { api } from '../../../core/api/client';
import type {
  ShareResourceType,
  PublicLeafNode,
  PublicResource,
} from '../types';

export const publicService = {
  async getResource(
    resourceType: ShareResourceType,
    resourceId: string,
    token: string,
  ): Promise<PublicResource> {
    const response = await api.get<PublicResource>(
      `/public/${resourceType}/${resourceId}`,
      { params: { token } },
    );
    return response.data;
  },

  async getNotebookLeaves(
    notebookId: string,
    token: string,
  ): Promise<PublicLeafNode[]> {
    const response = await api.get<PublicLeafNode[]>(
      `/public/notebooks/${notebookId}/leaves`,
      { params: { token } },
    );
    return response.data;
  },
};

export default publicService;