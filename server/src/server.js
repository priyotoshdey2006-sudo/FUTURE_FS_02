import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import leadRoutes from './routes/leads.js';
import { notFound, errorHandler } from './middleware/validate.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me') {
  console.error('Set a strong JWT_SECRET in .env before starting.');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1); // needed for correct rate limiting behind Render/Railway

const allowed = (process.env.CLIENT_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // allow tools like curl/Postman (no origin) and whitelisted sites
      if (!origin || allowed.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json({ limit: '50kb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`API running on port ${PORT}`)))
  .catch((err) => {
    console.error('Startup failed:', err.message);
    process.exit(1);
  });
