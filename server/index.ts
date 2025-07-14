import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// --- SESSION STORE SETUP ---
let sessionStore;
let redisClient: any = null;

// Initialize session store
async function initializeSessionStore() {
  // Try to use Redis if available, otherwise fall back to memory store
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379"
    });
    
    // Test Redis connection
    await redisClient.connect();
    await redisClient.ping();
    
    const { RedisStore } = await import("connect-redis");
    sessionStore = new RedisStore({ client: redisClient });
    console.log("✅ Using Redis session store");
  } catch (error) {
    console.log("⚠️ Redis not available, using memory session store");
    console.log("Redis error:", error instanceof Error ? error.message : String(error));
    
    // Fallback to memory store
    const session = await import("express-session");
    sessionStore = new session.MemoryStore();
  }
}

// --- CORS CONFIGURATION ---
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173", // Set to your frontend URL in production
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize session store and set up session middleware
(async () => {
  await initializeSessionStore();
  
  // --- SESSION CONFIGURATION ---
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'doogle-admin-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to false for development to work with HTTP
      httpOnly: true,
      sameSite: 'lax', // Set to lax for development
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  console.log("✅ Session middleware configured");
})();

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

// Health check endpoint for Redis/session
app.get('/api/health', async (req, res) => {
  try {
    let redisStatus = 'not_configured';
    let redisPing = null;
    
    // Check if Redis client exists (only if Redis was successfully connected)
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
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err instanceof Error ? err.message : String(err) });
  }
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
