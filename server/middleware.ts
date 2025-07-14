// server/middleware.ts
import { Request, Response, NextFunction } from 'express';
import session from 'express-session';

// Extend Request interface to include session
interface RequestWithSession extends Request {
  session: session.Session & {
    isAdmin?: boolean;
  };
}

export function requireAdminAuth(req: RequestWithSession, res: Response, next: NextFunction) {
  // Check if user is authenticated as admin
  if (req.session.isAdmin) {
    return next();
  }
  
  // If not authenticated, redirect to admin login
  res.status(401).json({ 
    message: "Admin authentication required",
    error: "UNAUTHORIZED"
  });
}

// Admin login function
export function adminLogin(username: string, password: string): boolean {
  const correctUsername = "Doogle";
  const correctPassword = "Aa121322@Doogle143";
  return username === correctUsername && password === correctPassword;
}

// Admin logout function
export function adminLogout(req: RequestWithSession): void {
  req.session.isAdmin = false;
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying admin session:', err);
    }
  });
} 