import http from "http";
import fs from "fs";
import path from "path";
http.createServer((req, res) => {
  let url = req.url.split("?")[0];
  url = url.replace(/^\/New-Hope/, "");
  if (!url || url === "/") url = "/index.html";
  const fp = path.join("dist", url);
  try {
    const c = fs.readFileSync(fp);
    const ext = path.extname(fp);
    const m = { ".js": "application/javascript", ".css": "text/css", ".html": "text/html", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };
    res.writeHead(200, { "Content-Type": m[ext] || "text/plain" });
    res.end(c);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(5173, "127.0.0.1", () => console.log("http://127.0.0.1:5173/New-Hope/"));
