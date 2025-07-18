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
  console.log('🔐 [ADMIN AUTH] Checking authentication...');
  console.log('🔐 [ADMIN AUTH] Session exists:', !!req.session);
  console.log('🔐 [ADMIN AUTH] Session isAdmin:', req.session?.isAdmin);
  
  // ONLY allow session-based authentication - NO bypass tokens
  if (req.session?.isAdmin === true) {
    console.log('✅ [ADMIN AUTH] Session authentication successful');
    return next();
  }
  
  console.log('❌ [ADMIN AUTH] Authentication failed - no valid session found');
  
  // If not authenticated, return unauthorized
  res.status(401).json({ 
    message: "Admin authentication required",
    error: "UNAUTHORIZED",
    details: "Please log in with valid admin credentials"
  });
}

// Admin login function - Reverted to original secure credentials
export function adminLogin(username: string, password: string): boolean {
  // Original secure credentials - DO NOT CHANGE
  const correctUsername = "Doogle";
  const correctPassword = "Aa121322@Doogle143";
  
  console.log('🔐 [ADMIN LOGIN] Attempt:', { username, password: '***' });
  console.log('🔐 [ADMIN LOGIN] Expected username:', correctUsername);
  console.log('🔐 [ADMIN LOGIN] Password check:', password === correctPassword ? 'MATCH' : 'NO MATCH');
  
  const isValid = username === correctUsername && password === correctPassword;
  console.log('🔐 [ADMIN LOGIN] Result:', isValid ? 'SUCCESS' : 'FAILED');
  
  return isValid;
}

// Admin logout function
export function adminLogout(req: RequestWithSession): void {
  console.log('🔐 [ADMIN LOGOUT] Logging out admin user');
  req.session.isAdmin = false;
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ [ADMIN LOGOUT] Error destroying admin session:', err);
    } else {
      console.log('✅ [ADMIN LOGOUT] Admin session destroyed successfully');
    }
  });
} 