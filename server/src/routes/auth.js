import { Router } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';
import Admin from '../models/Admin.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Try again in 15 minutes.' },
});

router.post(
  '/login',
  loginLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').isString().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const admin = await Admin.findOne({ email: req.body.email });
      // Same message for both failures so attackers can't discover valid emails
      if (!admin || !(await admin.verifyPassword(req.body.password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      });
      res.json({ token, admin: { id: admin._id, email: admin.email } });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', requireAuth, (req, res) => res.json({ admin: req.admin }));

export default router;
