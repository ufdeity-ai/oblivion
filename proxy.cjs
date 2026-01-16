const express = require("express");
const { http, https } = require("follow-redirects");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

app.get("/proxy", (req, res) => {
  let targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send("Missing url parameter");

  // Normalize protocol
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = "https://" + targetUrl;
  }

  const client = targetUrl.startsWith("https") ? https : http;

  const proxyReq = client.get(
    targetUrl,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": targetUrl,
        "Origin": targetUrl,
      },
      followRedirects: true,
      maxRedirects: 10,
    },
    (proxyRes) => {
      const headers = { ...proxyRes.headers };

      // 🔓 Remove iframe blockers
      delete headers["x-frame-options"];
      delete headers["content-security-policy"];
      delete headers["content-security-policy-report-only"];
      delete headers["frame-ancestors"];
      delete headers["cross-origin-opener-policy"];
      delete headers["cross-origin-embedder-policy"];

      // 🔁 Keep redirects inside proxy
      if (headers.location) {
        headers.location = `/proxy?url=${encodeURIComponent(
          new URL(headers.location, targetUrl).href
        )}`;
      }

      res.writeHead(proxyRes.statusCode || 200, headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    res.status(502).send("Proxy Error");
  });
});

app.use((req, res) => {
  res.status(404).send("Not found");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🟣 Oblivion Proxy running on port ${PORT}`);
});
