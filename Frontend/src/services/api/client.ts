import { API_CONFIG } from "@/constants";
import { clearSession, pushToast, readSession, writeSession } from "@/store";
import type {
  ApiSuccessResponse,
  BackendRequestOptions,
  BackendMethod,
  BackendPath,
  ContractEnvelope,
  BackendResponseData
} from "@/types";
import { ApiRequestError } from "@/types";
import { toApiRequestError } from "@/utils";

interface RequestOptions {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
  headers?: HeadersInit;
  signal?: AbortSignal;
  idempotencyKey?: string;
}

type ContractRequestOptions<
  TPath extends BackendPath,
  TMethod extends BackendMethod<TPath>
> = Omit<RequestOptions, "path" | "method" | "body"> &
  BackendRequestOptions<TPath, TMethod>;

class ApiClient {
  private refreshPromise: Promise<boolean> | null = null;

  async request<T>({
    path,
    method = "GET",
    body,
    auth = false,
    headers,
    signal,
    idempotencyKey
  }: RequestOptions): Promise<ApiSuccessResponse<T>> {
    return this.performRequest<T>(
      { path, method, body, auth, headers, signal, idempotencyKey },
      false
    );
  }

  async requestContract<
    TPath extends BackendPath,
    TMethod extends BackendMethod<TPath>
  >({
    path,
    method,
    body,
    auth,
    headers,
    signal,
    idempotencyKey
  }: ContractRequestOptions<TPath, TMethod>): Promise<ContractEnvelope<TPath, TMethod>> {
    return this.performRequest<BackendResponseData<TPath, TMethod>>(
      {
        path,
        method: method as RequestOptions["method"],
        body,
        auth,
        headers,
        signal,
        idempotencyKey
      },
      false
    );
  }

  private async performRequest<T>(
    options: RequestOptions,
    isRetry: boolean
  ): Promise<ApiSuccessResponse<T>> {
    const session = readSession();
    const requestHeaders = new Headers(headersToObject(options.headers));
    requestHeaders.set("Accept", "application/json");

    if (options.body !== undefined) {
      requestHeaders.set("Content-Type", "application/json");
    }

    if (options.auth && session?.accessToken) {
      requestHeaders.set("Authorization", `Bearer ${session.accessToken}`);
    }

    if (options.idempotencyKey) {
      requestHeaders.set("Idempotency-Key", options.idempotencyKey);
    }

    let response: Response;

    try {
      response = await fetch(`${API_CONFIG.baseUrl}${options.path}`, {
        method: options.method,
        headers: requestHeaders,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: options.signal
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      throw new ApiRequestError({
        statusCode: 0,
        code: "NETWORK_ERROR",
        message:
          "We could not reach the backend. Check that the API server is running and the base URL is correct.",
        requestId: null
      });
    }

    const payload = await parseResponsePayload(response);

    if (response.status === 401 && options.auth && !isRetry && options.path !== "/auth/refresh") {
      const refreshed = await this.tryRefreshSession();

      if (refreshed) {
        return this.performRequest<T>(options, true);
      }
    }

    if (!response.ok) {
      throw toApiRequestError({
        statusCode: response.status,
        payload,
        fallbackMessage: `Request failed with status ${response.status}.`
      });
    }

    return payload as ApiSuccessResponse<T>;
  }

  private async tryRefreshSession() {
    const currentSession = readSession();

    if (!currentSession?.refreshToken) {
      clearSession();
      return false;
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.performRequest<{ tokens: BackendResponseData<"/auth/refresh", "POST">["tokens"] }>(
        {
          path: "/auth/refresh",
          method: "POST",
          body: { refreshToken: currentSession.refreshToken }
        },
        true
      )
        .then((payload) => {
          writeSession(payload.data.tokens);
          return true;
        })
        .catch(() => {
          clearSession();
          pushToast({
            tone: "warning",
            title: "Your session expired",
            description:
              "We cleared local auth state after refresh failed. Sign in again to continue."
          });
          return false;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }
}

const headersToObject = (headers?: HeadersInit) => {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
};

const parseResponsePayload = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
};

export const apiClient = new ApiClient();
