import { QueryClient, QueryFunction } from "@tanstack/react-query";

export class ApiError extends Error {
  status: number;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    const retryAfterHeader = Number(res.headers.get("retry-after"));
    const headerRetryAfterSeconds = Number.isFinite(retryAfterHeader) ? retryAfterHeader : undefined;

    if (contentType.includes("application/json")) {
      const body = await res.json().catch(() => null);
      const message =
        (body && typeof body.error === "string" && body.error) ||
        (body && typeof body.message === "string" && body.message) ||
        res.statusText ||
        "Request failed";
      const bodyRetryAfterSeconds =
        body && typeof body.retryAfterSeconds === "number" && Number.isFinite(body.retryAfterSeconds)
          ? body.retryAfterSeconds
          : undefined;
      throw new ApiError(message, res.status, bodyRetryAfterSeconds ?? headerRetryAfterSeconds);
    }

    const text = (await res.text()) || res.statusText;
    throw new ApiError(text, res.status, headerRetryAfterSeconds);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const baseUrl = import.meta.env.VITE_API_URL || "";
  const fullUrl = baseUrl + url;
  const isFormData = data instanceof FormData;
  const res = await fetch(fullUrl, {
    method,
    headers: data && !isFormData ? { "Content-Type": "application/json" } : {},
    body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    const fullUrl = baseUrl + "/" + queryKey.join("/");
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
