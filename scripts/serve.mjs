import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number.parseInt(process.env.PORT ?? "4173", 10);
const host = process.env.HOST ?? "127.0.0.1";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".vtt", "text/vtt; charset=utf-8"],
]);

function responseHeaders(filePath) {
  return {
    "Cache-Control": filePath.endsWith("index.html")
      ? "no-cache"
      : "public, max-age=300",
    "Content-Security-Policy": [
      "default-src 'self'",
      "img-src 'self' data:",
      "style-src 'self'",
      "script-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'self'",
    ].join("; "),
    "Cross-Origin-Opener-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };
}

function safePath(url, rootDirectory) {
  const pathname = decodeURIComponent(new URL(url, "http://local").pathname);
  // Reject Windows separators on every platform so an encoded traversal has
  // the same fail-closed result in local Windows runs and Linux CI.
  if (pathname.includes("\\")) return null;
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = resolve(rootDirectory, relative);
  if (
    filePath !== rootDirectory &&
    !filePath.startsWith(`${rootDirectory}${sep}`)
  ) {
    return null;
  }
  return filePath;
}

export function createStaticServer({ rootDirectory = root } = {}) {
  const absoluteRoot = resolve(rootDirectory);
  return createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end("Method not allowed");
      return;
    }

    let filePath;
    try {
      filePath = safePath(request.url ?? "/", absoluteRoot);
    } catch {
      response.writeHead(400);
      response.end("Bad request");
      return;
    }

    if (!filePath) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) throw new Error("Not a file");
      response.writeHead(200, {
        ...responseHeaders(filePath),
        "Content-Length": fileStat.size,
        "Content-Type":
          contentTypes.get(extname(filePath)) ?? "application/octet-stream",
      });
      if (request.method === "HEAD") response.end();
      else createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404, responseHeaders(filePath));
      response.end("Not found");
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createStaticServer();
  server.listen(port, host, () => {
    console.log(`CueMend is ready at http://${host}:${port}`);
  });
}
