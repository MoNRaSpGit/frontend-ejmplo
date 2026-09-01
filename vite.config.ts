import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const packageJson = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8")) as { version?: string };
const frontendVersion = packageJson.version || "0.1.0";

function resolveGitShortSha() {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"]
    })
      .toString()
      .trim();
  } catch {
    return "local";
  }
}

const frontendReleaseSha = process.env.VITE_RELEASE_SHA || process.env.RELEASE_SHA || resolveGitShortSha();
const frontendReleaseCreatedAt = process.env.VITE_RELEASE_CREATED_AT || process.env.RELEASE_CREATED_AT || new Date().toISOString();

export default defineConfig(({ mode }) => {
  const isGithubPagesBuild = mode === "github-pages";
  const appBuildMeta = JSON.stringify(
    {
      version: frontendVersion,
      releaseSha: frontendReleaseSha,
      releaseCreatedAt: frontendReleaseCreatedAt,
      environment: mode
    },
    null,
    2
  );

  return {
    base: isGithubPagesBuild ? "/frontend-ejmplo/" : "/",
    plugins: [
      react(),
      {
        name: "ejemplo-app-build-meta",
        configureServer(server) {
          server.middlewares.use("/app-build.json", (_request, response) => {
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.setHeader("Cache-Control", "no-store");
            response.end(appBuildMeta);
          });
        },
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "app-build.json",
            source: appBuildMeta
          });
        }
      },
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["icon-192.png", "icon-512.png"],
        manifest: {
          name: "Sistema de venta - Demo",
          short_name: "Demo venta",
          description: "Ejemplo de sistema de venta, personalizable segun el rubro del cliente.",
          lang: "es",
          theme_color: "#8a5a34",
          background_color: "#faf6ef",
          display: "standalone",
          scope: "./",
          start_url: "./",
          icons: [
            { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
          ]
        },
        workbox: {
          navigateFallback: isGithubPagesBuild ? "/frontend-ejmplo/index.html" : "/index.html"
        }
      })
    ],
    define: {
      __APP_VERSION__: JSON.stringify(frontendVersion),
      __APP_RELEASE_SHA__: JSON.stringify(frontendReleaseSha),
      __APP_RELEASE_CREATED_AT__: JSON.stringify(frontendReleaseCreatedAt)
    }
  };
});
