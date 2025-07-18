import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: any,
  isAdminRequest: boolean = false
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // For admin requests, only use session-based authentication
  if (isAdminRequest) {
    // Remove bypass token - only use session cookies
    console.log('🔐 [API REQUEST] Using session-based authentication for admin request');
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: "include", // Always include credentials for session
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  return fetch(url, config);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const isAdminRequest = url.includes('/api/admin/');
    const adminToken = sessionStorage.getItem('adminToken');
    const headers: Record<string, string> = {};
    // Add admin bypass token for admin requests
    if (isAdminRequest && adminToken) {
      headers['x-admin-bypass'] = adminToken;
    }

    const res = await fetch(url, {
      credentials: "include",
      headers,
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
