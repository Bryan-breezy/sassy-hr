import "dotenv/config";
import express, { type Express, type Request, type Response } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerLocalAuthRoutes } from "./localAuth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { validateGoogleSheetsConfig } from "../db";
import { createContext } from "./context";
import { serveStatic } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function buildApp(): Promise<Express> {
  try {
    validateGoogleSheetsConfig();
  } catch (err) {
    console.error("[startup]", (err as Error).message);
  }

  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerLocalAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Only load Vite in local development — never on Vercel/production
  if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
    const { setupVite } = await import("./vite");
    const server = createServer(app);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Simple health check so we can verify the function boots
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, env: process.env.NODE_ENV, vercel: !!process.env.VERCEL });
  });

  return app;
}

let appPromise: Promise<Express> | null = null;

function getApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = buildApp();
  }
  return appPromise;
}

// Vercel serverless handler
export default async function handler(req: Request, res: Response) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err) {
    console.error("[handler]", err);
    res.status(500).json({
      error: "Server failed to start",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

// Local development / traditional hosting
if (!process.env.VERCEL && !process.env.NOW_REGION) {
  (async () => {
    try {
      const app = await getApp();
      const server = createServer(app);

      const preferredPort = parseInt(process.env.PORT || "3000");
      const port = await findAvailablePort(preferredPort);

      if (port !== preferredPort) {
        console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
      }

      server.listen(port, () => {
        console.log(`Server running on http://localhost:${port}/`);
      });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}
