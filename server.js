/* eslint-disable @typescript-eslint/no-require-imports */

const http = require("node:http");
const next = require("next");

const dev = false;
const hostname = "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    http
      .createServer((req, res) => {
        handle(req, res);
      })
      .listen(port, hostname, () => {
        console.log(`TradeHax server ready on http://${hostname}:${port}`);
      });
  })
  .catch((error) => {
    console.error("Failed to start TradeHax server:", error);
    process.exit(1);
  });
