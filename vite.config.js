import { defineConfig } from 'vite';
let diagnostics = { status: 'waiting-for-browser' };
export default defineConfig({
  plugins: [{ name: 'local-render-diagnostics', configureServer(server) {
    server.middlewares.use('/__render-health', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; if (body.length > 24000) req.destroy(); });
        req.on('end', () => { try { diagnostics = { ...JSON.parse(body), receivedAt: new Date().toISOString() }; res.end('{"ok":true}'); } catch { res.statusCode = 400; res.end('{"ok":false}'); } });
      } else { res.end(JSON.stringify(diagnostics)); }
    });
  } }],
  build: { chunkSizeWarningLimit: 800 }
});