import "dotenv/config";
import express, { type Express } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerLocalAuthRoutes } from "./localAuth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { validateGoogleSheetsConfig } from "../db";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

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
  // Soft validation so the function can still start and return a clear error page/API response
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

  if (process.env.NODE_ENV === "development") {
    const server = createServer(app);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return app;
}

// Shared app instance (used by both local Node and Vercel)
const appPromise = buildApp();

// Vercel serverless expects a default export that is a request handler (Express app works)
export default async function handler(req: any, res: any) {
  const app = await appPromise;
  return app(req, res);
}

// Local development / traditional hosting: listen on a port
if (!process.env.VERCEL && !process.env.NOW_REGION) {
  (async () => {
    try {
      const app = await appPromise;
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
