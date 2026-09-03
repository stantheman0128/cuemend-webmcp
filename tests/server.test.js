import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { request } from "node:http";

import { createStaticServer } from "../scripts/serve.mjs";

function rawRequest({ port, method = "GET", path = "/" }) {
  return new Promise((resolve, reject) => {
    const outgoing = request(
      {
        host: "127.0.0.1",
        port,
        method,
        path,
        agent: false,
        headers: { Connection: "close" },
      },
      (incoming) => {
        const chunks = [];
        incoming.on("data", (chunk) => chunks.push(chunk));
        incoming.on("end", () =>
          resolve({
            status: incoming.statusCode,
            headers: incoming.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    outgoing.on("error", reject);
    outgoing.end();
  });
}

test("static server serves the app with safe methods, paths, and headers", async (t) => {
  const server = createStaticServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const { port } = server.address();

  const home = await rawRequest({ port });
  assert.equal(home.status, 200);
  assert.match(home.body, /<title>CueMend/);
  assert.match(home.headers["content-type"], /^text\/html/);
  assert.match(home.headers["content-security-policy"], /default-src 'self'/);

  const module = await rawRequest({ port, path: "/src/app.js" });
  assert.equal(module.status, 200);
  assert.match(module.headers["content-type"], /^text\/javascript/);

  const head = await rawRequest({ port, method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(head.body, "");

  const post = await rawRequest({ port, method: "POST" });
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, "GET, HEAD");

  const traversal = await rawRequest({
    port,
    path: "/%2e%2e%5cpackage.json",
  });
  assert.equal(traversal.status, 403);

  const missing = await rawRequest({ port, path: "/not-here.txt" });
  assert.equal(missing.status, 404);
});
