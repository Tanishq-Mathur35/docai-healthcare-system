export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function successResponse<T>(message: string, data?: T, meta?: ApiResponse['meta']): ApiResponse<T> {
  return { success: true, message, data, meta };
}

export function errorResponse(message: string, error?: string): ApiResponse {
  return { success: false, message, error };
}
