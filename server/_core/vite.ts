import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Prefer the Vite build output that exists both locally and on Vercel
  const candidates = [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(import.meta.dirname, "..", "..", "dist", "public"),
    path.resolve(import.meta.dirname, "public"),
    path.resolve(process.cwd(), "public"),
  ];

  let distPath = candidates.find((p) => fs.existsSync(p));

  if (!distPath) {
    console.error(
      `Could not find the client build directory. Tried:\n${candidates.join("\n")}`
    );
    // Still register a fallback so the function doesn't crash on every request
    distPath = path.resolve(process.cwd(), "dist", "public");
  }

  app.use(express.static(distPath));

  // SPA fallback
  app.use("*", (_req, res) => {
    const index = path.resolve(distPath!, "index.html");
    if (fs.existsSync(index)) {
      res.sendFile(index);
    } else {
      res
        .status(500)
        .send(
          "Client build not found. Run `pnpm build` and ensure dist/public exists."
        );
    }
  });
}
