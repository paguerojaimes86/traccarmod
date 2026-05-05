/**
 * Mini-backend público para Traccar
 * 
 * Sirve el frontend compilado + endpoints públicos con tokens firmados.
 * Mantiene una sesión admin con Traccar internamente — nunca expone credenciales.
 * 
 * npm install express http-proxy-middleware
 * node server/server.mjs
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 5173;
const TRACCAR_URL = 'https://gps.msglobalgps.com';

// ─── Config ───────────────────────────────────────────────────────
const ADMIN_EMAIL = process.env.TRACCAR_EMAIL || 'administrador@surexpress.com';
const ADMIN_PASSWORD = process.env.TRACCAR_PASSWORD || '2jPrQ1V66A';
const HMAC_SECRET = process.env.HMAC_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRATION_HOURS = parseInt(process.env.TOKEN_EXP_HOURS || '24');
const RENEW_INTERVAL_MS = 12 * 60 * 60 * 1000; // renovar sesión cada 12hs

let adminCookie = '';

async function login() {
  try {
    const resp = await fetch(`${TRACCAR_URL}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      redirect: 'manual',
    });
    const cookies = resp.headers.getSetCookie?.() ?? [];
    const sessionCookie = cookies.find((c) => c.startsWith('JSESSIONID'));
    if (sessionCookie) {
      adminCookie = sessionCookie.split(';')[0];
      console.log('[server] sesión admin renovada');
    } else {
      console.warn('[server] no se pudo obtener cookie de sesión');
    }
  } catch (err) {
    console.error('[server] error de login:', err.message);
  }
}

await login();
setInterval(login, RENEW_INTERVAL_MS);

// ─── Middleware ────────────────────────────────────────────────────
app.use(express.json());

// ─── Generar token público ────────────────────────────────────────
app.post('/api/public/generate', (req, res) => {
  try {
    const { deviceIds } = req.body;
    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ error: 'deviceIds requerido' });
    }

    const payload = {
      deviceIds,
      exp: Date.now() + TOKEN_EXPIRATION_HOURS * 3600_000,
    };

    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');

    const token = `${data}.${sig}`;
    const url = `${req.protocol}://${req.get('host')}/v/${token}`;

    res.json({ token, url, expiresIn: TOKEN_EXPIRATION_HOURS * 3600 });
  } catch (err) {
    res.status(500).json({ error: 'Error al generar token' });
  }
});

// ─── Verificar token y devolver posiciones ────────────────────────
app.get('/api/public/view', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token requerido' });
    }

    // Verificar firma
    const parts = token.split('.');
    if (parts.length !== 2) return res.status(400).json({ error: 'Token inválido' });

    const [data, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
    if (sig !== expectedSig) return res.status(403).json({ error: 'Token inválido' });

    // Decodificar payload
    let payload;
    try {
      payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    } catch {
      return res.status(400).json({ error: 'Token inválido' });
    }

    // Verificar expiración
    if (Date.now() > payload.exp) {
      return res.status(410).json({ error: 'Token expirado' });
    }

    // Obtener posiciones desde Traccar
    if (!adminCookie) return res.status(503).json({ error: 'Servicio no disponible' });

    const deviceParams = payload.deviceIds.map((id) => `deviceId=${id}`).join('&');
    const from = new Date(Date.now() - 3600_000).toISOString();
    const to = new Date().toISOString();

    const posResp = await fetch(`${TRACCAR_URL}/api/positions?${deviceParams}`, {
      headers: { Cookie: adminCookie },
    });

    if (!posResp.ok) {
      return res.status(502).json({ error: 'Error al consultar posiciones' });
    }

    const positions = await posResp.json();
    res.json({ positions });
  } catch (err) {
    console.error('[server] error en view:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// ─── Servir frontend compilado ────────────────────────────────────
app.use(express.static('dist'));

// ─── Proxy /api a Traccar (autenticado) ───────────────────────────
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/public')) return next();
  next();
}, createProxyMiddleware({
  target: TRACCAR_URL,
  changeOrigin: true,
  cookieDomainRewrite: '',
  on: {
    proxyReq: (proxyReq) => {
      if (adminCookie) {
        proxyReq.setHeader('Cookie', adminCookie);
      }
    },
  },
}));

// ─── SPA fallback ─────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'dist' });
});

app.listen(PORT, () => {
  console.log(`[server] escuchando en http://localhost:${PORT}`);
  console.log(`[server] proxy a ${TRACCAR_URL}`);
});
