import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth.router';
import storageRouter, { UPLOADS_DIR } from './routes/storage.router';
import queryRouter from './routes/query.router';

const app = express();

// ── Global Middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve uploaded files as static assets
app.use('/uploads', express.static(UPLOADS_DIR));

// Legacy dummy route kept for backwards compatibility (old signed-url format)
app.get(/^\/dummy\/.*/, (_req, res) => {
  res.setHeader('Content-Type', 'application/pdf');
  const emptyPdf = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Archivo Simulado) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000109 00000 n\n0000000213 00000 n\n0000000301 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n396\n%%EOF',
    'utf-8',
  );
  res.send(emptyPdf);
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/storage', storageRouter);
app.use('/api/query', queryRouter);

export default app;
