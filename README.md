# GoalSync Pro - Enterprise Goal Management Platform

GoalSync Pro is an In-House Goal Setting & Tracking Portal designed for organizations. It modernizes the employee goal management lifecycle with advanced quarterly check-ins, dynamic scoring, and a role-based approval workflow.

## Features
- **Role-Based Access Control**: Employee, Manager, Admin roles.
- **Goal Workflows**: Draft -> Submit -> Approve -> Lock.
- **Dynamic Weightage Validation**: Total weightage must be exactly 100%.
- **Quarterly Check-ins**: Log planned vs actual progress.
- **Scoring Engine**: Min (higher is better), Max (lower is better), Timeline, and Zero-Based calculations.
- **Analytics Module**: System health, status distribution, export to CSV.

## Tech Stack
- **Frontend**: React.js, Vite, Tailwind CSS (v4), React Router, Axios, Recharts, Lucide React.
- **Backend**: Node.js, Express.js, JWT, Mongoose.
- **Database**: MongoDB.

## Project Structure
```
atomquest/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/ # Shared layout components (Sidebar, Topbar)
│   │   ├── context/    # Global state (AuthContext)
│   │   ├── pages/      # Role-specific dashboard pages
│   │   └── services/   # API configuration (Axios)
└── server/           # Express backend
    ├── config/       # Database connection
    ├── controllers/  # Route logic handlers
    ├── middleware/   # JWT verification and RBAC authorization
    ├── models/       # Mongoose schemas (User, Goal, CheckIn, AuditLog)
    ├── routes/       # Express API routes
    └── utils/        # Scoring engine logic
```

## Setup Instructions

### Environment Variables
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/goalsync
JWT_SECRET=your_super_secret_key
```

### Running Locally

**1. Start the Backend:**
```bash
cd server
npm install
npm run dev # or node index.js
```
*The server will run on http://localhost:5000*

**2. Start the Frontend:**
```bash
cd client
npm install
npm run dev
```
*The React app will be available at http://localhost:5173*

## API Documentation

### Auth Routes
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate user and get token
- `GET /api/auth/me` - Get current user profile

### Goal Routes (Employee)
- `GET /api/goals` - Fetch own goals
- `POST /api/goals` - Create a new goal
- `PUT /api/goals/:id` - Edit a draft goal
- `DELETE /api/goals/:id` - Delete a draft goal
- `POST /api/goals/submit` - Bulk submit draft goals for review

### Manager Routes
- `GET /api/manager/goals` - Get all goals submitted by team
- `PUT /api/manager/goals/:id/review` - Approve, edit, or return a goal

### Check-in Routes
- `GET /api/checkins` - Fetch check-in history
- `POST /api/checkins` - Log a new check-in and calculate score

### Admin Routes
- `GET /api/admin/analytics` - System metrics (counts, status distributions)
- `GET /api/admin/users` - Fetch all users in system

## Deployment
- **Frontend**: Deploy `client` folder to Vercel or Netlify. Build command: `npm run build`.
- **Backend**: Deploy `server` folder to Render, Heroku, or AWS. Ensure `MONGO_URI` is pointing to MongoDB Atlas in environment variables.
- **Database**: Use MongoDB Atlas for production data storage.
