// server/middleware.ts
export function requireAdminAuth(req: any, res: any, next: any) {
  // No-op middleware: allow all requests (for development)
  next();
} 