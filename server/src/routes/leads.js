import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, query } from 'express-validator';
import Lead, { STATUSES, SOURCES } from '../models/Lead.js';
import { requireAuth } from '../middleware/auth.js';
import { validate, validObjectId } from '../middleware/validate.js';
import { notifyNewLead } from '../utils/mailer.js';

const router = Router();

/* ---------- PUBLIC: website contact form ---------- */

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { message: 'Too many submissions. Please try again later.' },
});

router.post(
  '/',
  submitLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
    body('message').optional({ checkFalsy: true }).trim().isLength({ max: 3000 }),
    body('source').optional().isIn(SOURCES).withMessage(`source must be one of: ${SOURCES.join(', ')}`),
  ],
  validate,
  async (req, res, next) => {
    try {
      // Honeypot: real users never fill the hidden "website" field, bots do
      if (req.body.website) return res.status(201).json({ message: 'Thank you!' });

      const { name, email, phone, message, source } = req.body;
      const lead = await Lead.create({ name, email, phone, message, source });
      notifyNewLead(lead); // intentionally not awaited
      res.status(201).json({ message: 'Thank you! We will contact you soon.' });
    } catch (err) {
      next(err);
    }
  }
);

/* ---------- PROTECTED: admin dashboard ---------- */

router.use(requireAuth);

// Summary cards (must be defined before "/:id")
router.get('/stats', async (req, res, next) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [total, newThisWeek, converted, byStatus, dueFollowUps] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ createdAt: { $gte: weekAgo } }),
      Lead.countDocuments({ status: 'converted' }),
      Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Lead.countDocuments({ followUpDate: { $lte: new Date() }, status: { $ne: 'converted' } }),
    ]);
    res.json({
      total,
      newThisWeek,
      converted,
      conversionRate: total ? Math.round((converted / total) * 1000) / 10 : 0,
      dueFollowUps,
      byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/',
  [
    query('status').optional().isIn(STATUSES),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { status, search } = req.query;
      const page = req.query.page || 1;
      const limit = req.query.limit || 20;

      const filter = {};
      if (status) filter.status = status;
      if (search) {
        const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = new RegExp(safe, 'i');
        filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
      }

      const [leads, total] = await Promise.all([
        Lead.find(filter)
          .select('-notes')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Lead.countDocuments(filter),
      ]);
      res.json({ leads, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:id', validObjectId, async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/:id',
  validObjectId,
  [
    body('status').optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
    body('followUpDate').optional({ nullable: true }).isISO8601().withMessage('followUpDate must be an ISO date'),
  ],
  validate,
  async (req, res, next) => {
    try {
      // Whitelist fields so nothing else can be overwritten
      const updates = {};
      if (req.body.status) updates.status = req.body.status;
      if ('followUpDate' in req.body) updates.followUpDate = req.body.followUpDate;

      const lead = await Lead.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
      if (!lead) return res.status(404).json({ message: 'Lead not found' });
      res.json(lead);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/notes',
  validObjectId,
  [body('text').trim().isLength({ min: 1, max: 2000 }).withMessage('Note text is required (max 2000 chars)')],
  validate,
  async (req, res, next) => {
    try {
      const lead = await Lead.findByIdAndUpdate(
        req.params.id,
        { $push: { notes: { $each: [{ text: req.body.text }], $position: 0 } } },
        { new: true }
      );
      if (!lead) return res.status(404).json({ message: 'Lead not found' });
      res.status(201).json(lead);
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', validObjectId, async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
