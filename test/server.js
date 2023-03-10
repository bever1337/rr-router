import fs from "fs";
import https from "https";
import path from "path";

const htmlPage = `<!DOCTYPE html>
<html>
  <head>
    <title>rr-router test</title>
  </head>
  <body>
    <p>Don't panic</p>
  </body>
</html>`;

export function httpsServerFactory() {
  return new Promise((resolve, reject) => {
    const server = https
      .createServer({
        key: fs.readFileSync(path.join(process.cwd(), "cert.key")).toString(),
        cert: fs.readFileSync(path.join(process.cwd(), "cert.pem")).toString(),
      })
      .on("close", () => {
        reject();
      })
      .on("error", (err) => {
        reject(err);
      })
      .on("listening", () => {
        resolve(server);
      })
      .on("request", (request, response) => {
        response.writeHead(200, { "Content-Type": "text/html" });
        response.write(htmlPage);
        response.end();
      })
      .listen(8000, "127.0.0.1");
  });
}
