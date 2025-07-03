import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const app = express();
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

async function killPortProcesses(port: number) {
  try {
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows command to find processes using the port
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split('\n').filter(line => line.includes('LISTENING'));
      
      const pids = new Set<string>();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          pids.add(pid);
        }
      }
      
      if (pids.size > 0) {
        log(`Found processes on port ${port}: ${Array.from(pids).join(', ')}`);
        for (const pid of pids) {
          try {
            await execAsync(`taskkill /F /PID ${pid}`);
            log(`Killed process ${pid} on port ${port}`);
          } catch (error) {
            log(`Failed to kill process ${pid}: ${error}`);
          }
        }
      }
    } else {
      // Linux/Unix command
      const { stdout } = await execAsync(`lsof -ti :${port}`);
      const pids = stdout.trim().split('\n').filter(pid => pid);
      
      if (pids.length > 0) {
        log(`Found processes on port ${port}: ${pids.join(', ')}`);
        for (const pid of pids) {
          try {
            await execAsync(`kill -9 ${pid}`);
            log(`Killed process ${pid} on port ${port}`);
          } catch (error) {
            log(`Failed to kill process ${pid}: ${error}`);
          }
        }
      }
    }
  } catch (error) {
    // No processes found on port or command failed, which is fine
    log(`No processes found on port ${port} or command failed`);
  }
}

(async () => {
  const port = 5000;
  
  // Kill any processes using port 5000 before starting
  await killPortProcesses(port);
  
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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const host = "0.0.0.0"; // Modified to bind to 0.0.0.0
  server.listen({
    port,
    host: host,
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();