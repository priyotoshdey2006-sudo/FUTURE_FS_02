import mongoose from 'mongoose';

export const STATUSES = ['new', 'contacted', 'converted'];
export const SOURCES = ['website', 'referral', 'social', 'other'];

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 30 },
    message: { type: String, trim: true, maxlength: 3000 },
    source: { type: String, enum: SOURCES, default: 'website' },
    status: { type: String, enum: STATUSES, default: 'new', index: true },
    followUpDate: { type: Date, default: null },
    notes: [noteSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Lead', leadSchema);
