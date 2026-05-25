export interface ApiMeta {
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: ApiMeta | null;
  requestId: string | null;
  timestamp: string;
}

export interface ApiErrorPayload {
  code?: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: ApiErrorPayload;
  requestId?: string | null;
  timestamp?: string;
}

export class ApiRequestError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;
  requestId?: string | null;

  constructor({
    message,
    statusCode,
    code,
    details,
    requestId
  }: {
    message: string;
    statusCode: number;
    code?: string;
    details?: unknown;
    requestId?: string | null;
  }) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}
