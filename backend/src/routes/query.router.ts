import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

/** Map frontend table names (plural) to Prisma model names (singular) */
const TABLE_MAP: Record<string, string> = {
  solicitudes: 'solicitud',
  profiles: 'profile',
  documentos: 'documento',
  historial: 'historial',
};

/** Convert date-only strings (YYYY-MM-DD) from form inputs to ISO-8601 DateTime */
function sanitizePayload(p: any): any {
  if (!p) return p;
  const copy = { ...p };
  if (typeof copy.fecha_inicio === 'string' && copy.fecha_inicio.length === 10) {
    copy.fecha_inicio = new Date(copy.fecha_inicio).toISOString();
  }
  if (typeof copy.fecha_fin === 'string' && copy.fecha_fin.length === 10) {
    copy.fecha_fin = new Date(copy.fecha_fin).toISOString();
  }
  return copy;
}

// POST /api/query
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      table, method, payload,
      q_eq, q_in, q_order, q_order_asc, q_limit, q_single,
    } = req.body;

    const modelName = TABLE_MAP[table] || table;
    const model = (prisma as any)[modelName];

    if (!model) {
      return res.status(400).json({
        error: `Tabla desconocida: ${table} (Mapeado a: ${modelName})`,
      });
    }

    // Build WHERE conditions
    const conditions: Record<string, any> = {};
    if (q_eq) conditions[q_eq.col] = q_eq.val;
    if (q_in) conditions[q_in.col] = { in: q_in.vals };

    let result: any;

    if (method === 'select') {
      const args: any = {};
      if (Object.keys(conditions).length > 0) args.where = conditions;
      if (q_order) args.orderBy = { [q_order]: q_order_asc ? 'asc' : 'desc' };
      if (q_limit) args.take = q_limit;

      let items = await model.findMany(args);

      if (q_single) {
        items = items.length > 0 ? items[0] : null;
      }

      result = items;

    } else if (method === 'insert') {
      result = await model.create({ data: sanitizePayload(payload) });

    } else if (method === 'update') {
      if (conditions.id) {
        result = await model.update({
          where: { id: conditions.id },
          data: sanitizePayload(payload),
        });
      } else if (Object.keys(conditions).length > 0) {
        result = await model.updateMany({
          where: conditions,
          data: sanitizePayload(payload),
        });
      } else {
        throw new Error('Faltan condiciones para el update');
      }

    } else if (method === 'delete') {
      if (conditions.id) {
        result = await model.delete({ where: { id: conditions.id } });
      } else {
        result = await model.deleteMany({ where: conditions });
      }
    }

    return res.json({ data: result, error: null });
  } catch (error: any) {
    console.error('[query error]', error.message);
    return res.json({ data: null, error: { message: error.message } });
  }
});

export default router;
