const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { createSocketServer } = require("./src/lib/socket-server");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);
const wsPort = parseInt(process.env.WS_PORT ?? "3001", 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Next.js HTTP server
  const nextServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  nextServer.listen(port, () => {
    console.log(`> Next.js ready on http://localhost:${port}`);
  });

  // Separate WebSocket server
  const wsHttpServer = createServer();
  createSocketServer(wsHttpServer);
  wsHttpServer.listen(wsPort, () => {
    console.log(`> Socket.IO ready on ws://localhost:${wsPort}`);
  });
});
