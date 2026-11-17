# Mini CRM - Client Lead Management System

Future Interns - Full Stack Web Development - Task 2 (`FUTURE_FS_02`)

A CRM that captures leads from a business website's contact form and lets the owner track each one from **new -> contacted -> converted**, with notes and follow-up dates.

**Status:** Backend API complete. Dashboard (React) coming next.

## Tech stack
Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt, Nodemailer, Helmet, express-validator, express-rate-limit.

## Features
- Public lead capture endpoint (validated, rate limited, honeypot spam trap)
- Email alert to the owner on every new lead
- Secure admin login (bcrypt + JWT)
- Lead listing with search, status filter and pagination
- Status updates, notes timeline, follow-up dates
- Dashboard stats (total, new this week, conversion rate, due follow-ups)

## Setup
```bash
cd server
npm install
cp .env.example .env     # then fill in the values
npm run seed:admin       # creates the first admin
npm run dev              # http://localhost:5000
```

## API
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/leads` | Public | Submit a lead from the website form |
| POST | `/api/auth/login` | Public | Returns a JWT |
| GET | `/api/auth/me` | Admin | Current admin |
| GET | `/api/leads?status=&search=&page=&limit=` | Admin | List leads |
| GET | `/api/leads/stats` | Admin | Dashboard numbers |
| GET | `/api/leads/:id` | Admin | Lead details with notes |
| PATCH | `/api/leads/:id` | Admin | Update `status` / `followUpDate` |
| POST | `/api/leads/:id/notes` | Admin | Add a note `{ "text": "..." }` |
| DELETE | `/api/leads/:id` | Admin | Delete a lead |

Send the token as `Authorization: Bearer <token>`.

## Website form integration
Include a hidden `website` input (CSS-hidden) as a spam trap, then:
```js
fetch(`${API_URL}/api/leads`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, phone, message, source: 'website' }),
});
```
Add the website's domain to `CLIENT_ORIGINS` so CORS allows it.

## Deployment
API on Render/Railway, database on MongoDB Atlas. Set every variable from `.env.example` in the host's dashboard.
