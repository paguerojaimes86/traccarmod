import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import crypto from 'node:crypto'

const HMAC_SECRET = crypto.randomBytes(32).toString('hex');

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'public-api',
      configureServer(server) {
        // POST /api/public/generate — crear token público
        server.middlewares.use('/api/public/generate', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
          }
          try {
            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', () => {
              const { deviceIds } = JSON.parse(body);
              if (!deviceIds?.length) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'deviceIds requerido' }));
                return;
              }
              const payload = {
                deviceIds,
                exp: Date.now() + 24 * 3600_000,
              };
              const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
              const sig = crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
              const token = `${data}.${sig}`;
              const url = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/v/${token}`;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ token, url, expiresIn: 86400 }));
            });
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Error al generar token' }));
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, './src/app'),
      '@features': path.resolve(__dirname, './src/features'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@api': path.resolve(__dirname, './src/shared/api'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://gps.msglobalgps.com',
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@tanstack')) {
            return 'vendor-query';
          }
          if (id.includes('node_modules/maplibre-gl')) {
            return 'vendor-map';
          }
        },
      },
    },
  },
})
