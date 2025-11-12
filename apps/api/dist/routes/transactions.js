import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { requireRole } from './auth.js';
import { createAuditHelper } from '../lib/audit.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginated, created, updated, deleted, success } from '../lib/response.js';
const router = Router();
const parseQuery = (q) => {
    const from = q.from ? new Date(String(q.from)) : undefined;
    const to = q.to ? new Date(String(q.to)) : undefined;
    const type = q.type && ['INCOME', 'EXPENSE', 'TRANSFER'].includes(String(q.type))
        ? String(q.type)
        : undefined;
    const accountId = q.accountId ? Number(q.accountId) : undefined;
    const categoryId = q.categoryId ? Number(q.categoryId) : undefined;
    const limit = q.limit ? Math.min(100, Math.max(1, Number(q.limit))) : 50;
    const offset = q.offset ? Math.max(0, Number(q.offset)) : 0;
    return { from, to, type, accountId, categoryId, limit, offset };
};
/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get transactions with filters
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date filter
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date filter
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE, TRANSFER]
 *         description: Transaction type filter
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: integer
 *         description: Account ID filter
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Category ID filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 */
router.get('/', asyncHandler(async (req, res) => {
    const { from, to, type, accountId, categoryId, limit, offset } = parseQuery(req.query);
    const where = {};
    if (from || to) {
        where.occurredAt = {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {})
        };
    }
    if (type)
        where.type = type;
    if (accountId)
        where.accountId = accountId;
    if (categoryId)
        where.categoryId = categoryId;
    const [items, total] = await Promise.all([
        prisma.transaction.findMany({ where, orderBy: { occurredAt: 'desc' }, take: limit, skip: offset, include: { account: true, category: true } }),
        prisma.transaction.count({ where })
    ]);
    return paginated(res, items, total, limit, offset);
}));
const createSchema = z.object({
    accountId: z.coerce.number().int().positive(),
    categoryId: z.coerce.number().int().positive().optional(),
    type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
    amountCents: z.coerce.number().int(),
    occurredAt: z.coerce.date(),
    description: z.string().optional(),
});
/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - type
 *               - amountCents
 *               - occurredAt
 *             properties:
 *               accountId:
 *                 type: integer
 *               categoryId:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE, TRANSFER]
 *               amountCents:
 *                 type: integer
 *                 description: Amount in cents
 *               occurredAt:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.post('/', requireRole(['admin']), asyncHandler(async (req, res) => {
    try {
        const payload = createSchema.parse(req.body);
        const transaction = await prisma.transaction.create({ data: payload });
        const audit = createAuditHelper(req);
        await audit.log('CREATE', 'Transaction', transaction.id, {
            type: transaction.type,
            amountCents: transaction.amountCents,
            accountId: transaction.accountId,
        });
        return created(res, transaction);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'issues' in error) {
            return res.status(400).json({ error: 'Invalid payload', issues: error.issues });
        }
        throw error;
    }
}));
router.put('/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid id' });
    }
    try {
        const existing = await prisma.transaction.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        const payload = createSchema.partial().parse(req.body);
        const transaction = await prisma.transaction.update({ where: { id }, data: payload });
        const audit = createAuditHelper(req);
        await audit.log('UPDATE', 'Transaction', id, {
            changes: Object.keys(payload),
            oldAmount: existing.amountCents,
            newAmount: transaction.amountCents,
        });
        return updated(res, transaction);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        if (error && typeof error === 'object' && 'issues' in error) {
            return res.status(400).json({ error: 'Invalid payload', issues: error.issues });
        }
        throw error;
    }
}));
router.delete('/:id', requireRole(['admin']), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid id' });
    }
    try {
        const existing = await prisma.transaction.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        await prisma.transaction.delete({ where: { id } });
        const audit = createAuditHelper(req);
        await audit.log('DELETE', 'Transaction', id, {
            type: existing.type,
            amountCents: existing.amountCents,
            accountId: existing.accountId,
        });
        return deleted(res);
    }
    catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        throw error;
    }
}));
/**
 * @swagger
 * /api/transactions/summary/overall:
 *   get:
 *     summary: Get financial summary
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Financial summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 income:
 *                   type: integer
 *                   description: Total income in cents
 *                 expense:
 *                   type: integer
 *                   description: Total expenses in cents
 *                 balance:
 *                   type: integer
 *                   description: Balance (income - expense) in cents
 */
router.get('/summary/overall', asyncHandler(async (req, res) => {
    const { from, to } = parseQuery(req.query);
    const where = {};
    if (from || to) {
        where.occurredAt = {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {})
        };
    }
    const [incomeAgg, expenseAgg] = await Promise.all([
        prisma.transaction.aggregate({ _sum: { amountCents: true }, where: { ...where, type: 'INCOME' } }),
        prisma.transaction.aggregate({ _sum: { amountCents: true }, where: { ...where, type: 'EXPENSE' } })
    ]);
    const income = incomeAgg._sum.amountCents ?? 0;
    const expense = expenseAgg._sum.amountCents ?? 0;
    const balance = income - expense;
    return success(res, { income, expense, balance });
}));
export default router;
