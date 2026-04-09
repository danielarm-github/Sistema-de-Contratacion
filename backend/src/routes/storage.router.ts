import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads dir exists on startup
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer: save temporarily to UPLOADS_DIR, then we move to subdirectory
const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage: multerStorage });

// POST /api/storage/upload
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  const storagePath = req.body.path as string; // e.g. "solicitudId/tipo_timestamp.pdf"

  if (!req.file || !storagePath) {
    return res.status(400).json({ error: 'Archivo o ruta faltante', data: null });
  }

  const targetPath = path.join(UPLOADS_DIR, storagePath);
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  fs.renameSync(req.file.path, targetPath);

  return res.json({ error: null, data: { path: storagePath } });
});

// GET /api/storage/url?path=...
router.get('/url', (req: Request, res: Response) => {
  const filePath = req.query.path as string;
  const PORT = process.env.PORT || 3001;
  return res.json({ data: { signedUrl: `http://localhost:${PORT}/uploads/${filePath}` } });
});

export default router;
