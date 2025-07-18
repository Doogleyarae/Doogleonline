import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// --- SESSION STORE SETUP ---
let sessionStore;
let redisClient: any = null;

// Always use memory store for now to ensure sessions work
sessionStore = new session.MemoryStore();
console.log("✅ Using memory session store for development");

// --- CORS CONFIGURATION ---
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173", // Set to your frontend URL in production
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- SESSION CONFIGURATION ---
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'doogle-admin-secret-key-2024',
  resave: true, // Changed to true to ensure session is saved
  saveUninitialized: true, // Changed to true to save new sessions
  cookie: {
    secure: false, // Set to false for development to work with HTTP
    httpOnly: true,
    sameSite: 'lax', // Set to lax for development
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'doogle-admin-session', // Custom session name
  rolling: true, // Extend session on each request
  unset: 'destroy' // Destroy session when unset
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Session debugging middleware
app.use((req: any, res, next) => {
  if (req.path.startsWith('/api/admin')) {
    console.log(`🔍 [SESSION DEBUG] ${req.method} ${req.path}`);
    console.log(`🔍 [SESSION DEBUG] Session exists:`, !!req.session);
    console.log(`🔍 [SESSION DEBUG] Session ID:`, req.sessionID);
    console.log(`🔍 [SESSION DEBUG] Session isAdmin:`, req.session?.isAdmin);
    console.log(`🔍 [SESSION DEBUG] Session data:`, req.session);
  }
  next();
});

// Health check endpoint for Redis/session
app.get('/api/health', async (req, res) => {
  try {
    let redisStatus = 'not_configured';
    let redisPing = null;
    if (redisClient) {
      redisStatus = redisClient.isOpen ? 'open' : 'closed';
      try {
        redisPing = await redisClient.ping();
      } catch (err) {
        redisPing = 'error';
      }
    }
    res.json({
      status: 'ok',
      redis: redisStatus,
      redisPing,
      session: req.session ? 'ok' : 'missing',
      sessionId: req.sessionID,
      sessionData: req.session ? Object.keys(req.session) : null,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err instanceof Error ? err.message : String(err) });
  }
});

// Test session endpoint
app.get('/api/test-session', (req: any, res) => {
  console.log('Session test endpoint hit');
  console.log('Session object:', !!req.session);
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  
  if (!req.session) {
    return res.status(500).json({ error: 'No session object' });
  }
  
  // Set a test value
  (req.session as any).testValue = 'test-' + Date.now();
  
  res.json({
    message: 'Session test successful',
    sessionId: req.sessionID,
    testValue: (req.session as any).testValue,
    isAdmin: (req.session as any).isAdmin || false
  });
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT environment variable for production, fallback to 5000 for development
  const port = process.env.PORT || 5000;
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
  
  server.listen({
    port: parseInt(port.toString()),
    host,
    reusePort: true,
  }, () => {
    log(`serving on http://${host}:${port}`);
  });
})();
