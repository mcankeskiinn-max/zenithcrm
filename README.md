# ZenithCRM 🚀

**Modern Insurance Agency Management System**

ZenithCRM is a full-stack CRM solution designed specifically for insurance agencies (Sigorta Acenteleri). It provides comprehensive tools for managing sales, commissions, team collaboration, and compliance tracking.

---

## ✨ Features

### 📊 Dashboard & Analytics
- Real-time sales performance metrics
- Interactive charts for revenue trends
- Cancellation analysis and insights
- Branch-level and agent-level reporting

### 💼 Sales Management
- Complete policy lifecycle tracking (Lead → Offer → Active → Cancelled)
- Multi-branch support with RBAC
- Document upload and management
- Advanced filtering and search

### 💰 Commission Engine
- Flexible rule-based commission calculation
- Support for ratio and fixed-amount formulas
- Branch and policy-type specific rules
- Automated commission tracking

### 👥 Team Collaboration
- Real-time messaging between agents
- Task assignment and tracking
- Role-based access control (Admin, Manager, Employee)
- User activity audit logs

### 🔒 Security & Compliance
- JWT-based authentication
- Rate limiting and brute-force protection
- Comprehensive audit logging
- Secure file upload with validation

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 24
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Routing**: React Router v7
- **Testing**: Vitest + React Testing Library

---

## 🚀 Quick Start

### Prerequisites
- Node.js 24+
- PostgreSQL database (or Supabase account)
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/mcankeskiinn-max/zenithcrm.git
cd zenithcrm
```

2. **Setup Backend**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma migrate dev
npm run seed
npm run dev
```

3. **Setup Frontend**
```bash
cd ../client
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5175
- Backend: http://localhost:3000
- Default login: `admin@sigorta.com` / `password123`

---

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production deployment instructions.

**Quick Deploy:**
- Backend: Render.com (Docker)
- Frontend: Netlify
- Database: Supabase PostgreSQL

---

## 🧪 Testing

### Run Backend Tests
```bash
cd server
npm test
```

### Run Frontend Tests
```bash
cd client
npm test
```

**Test Coverage:**
- Backend: Auth, Sales, Audit (100% pass)
- Frontend: Components, Utilities (100% pass)

---

## 📝 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN_SHORT=7d
CLIENT_URL=http://localhost:5175
PORT=3000
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

Notes:
- `VITE_API_URL` should be the API host root (not ending with `/api`), since the client calls `/api/*`.
- In production, ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are long random values.
- Auth uses httpOnly cookies; the client sends a CSRF header automatically for mutating requests.
- `Beni Hatırla` seçilirse refresh token süresi `JWT_REFRESH_EXPIRES_IN` ile uzatılır.

---

## 🧭 Recommended Free-Tier Stack

These align with our current architecture and give the best cost/perf tradeoff for early stage.
- App hosting: Railway
- Database + Auth + Storage: Supabase
- Media storage/transform: Cloudinary
- Email (transactional): Brevo
- Logs: Logtail
- LLM observability: Langfuse
- CDN (static): jsDelivr

---

## 🔐 AI / Storage Keys We Need

Backend support bot:
- `GOOGLE_AI_API_KEY`

AI system (embeddings + pipeline):
- `GEMINI_API_KEY`
- `GCS_BUCKET`
- `GOOGLE_APPLICATION_CREDENTIALS` (path to service account JSON)

Observability (optional):
- `SENTRY_DSN`
- `SENTRY_TRACES_SAMPLE_RATE`

---

## 📄 License

MIT License - feel free to use this project for your own insurance agency!

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Support

For issues or questions, please open a GitHub issue.

---

**Built with ❤️ for Insurance Agencies**
