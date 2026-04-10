export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  count: number;
  success: boolean;
  stats?: {
    total: number;
    active: number;
    inactive: number;
  };
}
