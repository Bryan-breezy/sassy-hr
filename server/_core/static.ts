import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const candidates = [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
    // fallbacks relative to this file when running from source
    path.resolve(import.meta.dirname, "..", "..", "dist", "public"),
    path.resolve(import.meta.dirname, "public"),
  ];

  const distPath = candidates.find((p) => fs.existsSync(p));

  if (!distPath) {
    console.error(
      `[serveStatic] Client build not found. Tried:\n${candidates.join("\n")}`
    );

    app.use("*", (_req, res) => {
      res
        .status(500)
        .send(
          "Client build not found. Ensure `pnpm build` ran and dist/public exists."
        );
    });
    return;
  }

  console.log(`[serveStatic] Serving static files from ${distPath}`);
  app.use(express.static(distPath));

  // SPA fallback
  app.use("*", (_req, res) => {
    const index = path.resolve(distPath, "index.html");
    if (fs.existsSync(index)) {
      res.sendFile(index);
    } else {
      res.status(500).send("index.html missing from client build.");
    }
  });
}
