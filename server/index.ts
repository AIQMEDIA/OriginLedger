import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializePhoenixTelemetry } from './phoenix-otel';

const app = express();

// 1. Safe HTTPS redirect middleware for Replit (prevents loops)
const forceHttps = (req: any, res: any, next: any) => {
  // Only redirect if not secure and not localhost/.repl.co
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
  const isLocal = req.hostname === "localhost" || req.hostname.endsWith(".repl.co");
  if (!isSecure && !isLocal) {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
};

app.use(forceHttps);

// 2. Set strong HTTP headers for security
const cspDirectives: any = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline for Vite dev
  objectSrc: ["'none'"],
  imgSrc: ["'self'", "data:", "blob:", "https:"],
  connectSrc: ["'self'", "ws:", "wss:", "https:"], // Allow websockets for Vite
  styleSrc: ["'self'", "'unsafe-inline'"],
  fontSrc: ["'self'", "https:", "data:"],
  frameSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"]
};

// Only add upgradeInsecureRequests in production
if (process.env.NODE_ENV === "production") {
  cspDirectives.upgradeInsecureRequests = [];
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: cspDirectives,
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

(async () => {
  // Initialize Phoenix OpenTelemetry observability
  initializePhoenixTelemetry();
  
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

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

// Export app for testing
export { app };
