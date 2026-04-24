# 🌍 CommunityCollab

### *Collaborate. Share. Thrive Together.*

<p align="center">
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-6+-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.IO-4.x-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/JWT-Auth-FB015B?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License MIT" />
</p>

---

## 📑 Table of Contents

- [About the Project](#-about-the-project)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [Step 1 — Clone the Repository](#step-1--clone-the-repository)
  - [Step 2 — Install Server Dependencies](#step-2--install-server-dependencies)
  - [Step 3 — Install Client Dependencies](#step-3--install-client-dependencies)
  - [Step 4 — MongoDB Setup](#step-4--mongodb-setup)
  - [Step 5 — Gmail SMTP Setup](#step-5--gmail-smtp-setup-required-for-email-notifications)
  - [Step 6 — Environment Variables Setup](#step-6--environment-variables-setup)
  - [Step 7 — Create Required Directories](#step-7--create-required-directories)
  - [Step 8 — Seed the Database](#step-8--seed-the-database)
  - [Step 9 — Run the Application](#step-9--run-the-application)
- [Test Login Credentials](#-test-login-credentials)
- [Features Walkthrough](#-features-walkthrough)
- [API Documentation](#-api-documentation)
- [Socket.IO Events](#-socketio-events)
- [Environment Variables Reference](#-environment-variables-reference)
- [Trust Score System](#-trust-score-system)
- [UPI Payment Flow](#-upi-payment-flow)
- [Legal and Safety](#-legal-and-safety)
- [Common Issues and Troubleshooting](#-common-issues-and-troubleshooting)
- [Scripts Reference](#-scripts-reference)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact and Acknowledgements](#-contact-and-acknowledgements)

---

## 🔍 About the Project

**CommunityCollab** is a full-stack community collaboration platform that brings people together to share resources, exchange skills, organize events, and help each other through group ordering and direct assistance. It solves the problem of fragmented community interaction by providing a single, unified platform where neighbors, coworkers, and community members can coordinate activities, pool purchases, teach and learn from one another, and lend resources — all with built-in trust scoring, real-time messaging, and email notifications. Whether you're a resident association, a college campus, or a neighborhood group, CommunityCollab gives you the tools to build a thriving, self-sustaining community.

### 🧩 Core Modules

| Module | Description |
|--------|-------------|
| **🛒 Group Pool Ordering** | Flexible shared ordering system where each participant adds their own product links and the pool creator places a combined order |
| **📚 Skill Exchange** | Teach what you know and learn what you don't through free, paid, or barter skill sessions |
| **🎪 Community Events** | Create and join charity drives, workshops, clean-up drives, and fundraisers |
| **🔧 Resource Sharing** | Lend and borrow tools, workspaces, vehicles, and more within your community |
| **🤝 Direct Assistance** | Post or respond to one-to-one help requests for errands, tutoring, delivery, and more |
| **💬 Real-Time Messaging** | Socket.IO powered group and direct messaging across all modules |

---

## 🛠 Tech Stack

<table>
<tr>
<td width="50%" valign="top">

### Frontend

| Technology | Purpose |
|------------|---------|
| React 19 + Vite 5 | UI framework and build tool |
| React Router v7 | Client-side routing |
| Axios | HTTP client for API calls |
| Socket.IO Client | Real-time communication |
| React Query (TanStack v5) | Server state management and caching |
| Tailwind CSS 3 | Utility-first CSS framework |
| date-fns | Date formatting utilities |

</td>
<td width="50%" valign="top">

### Backend

| Technology | Purpose |
|------------|---------|
| Node.js + Express.js | Server framework |
| MongoDB + Mongoose | Database and ODM |
| Socket.IO | WebSocket server |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| Nodemailer | Email notifications via SMTP |
| Multer | File upload handling |
| express-rate-limit | API rate limiting |
| Joi | Request validation |
| Cheerio + Axios | Product metadata scraping from URLs |
| express-async-errors | Async error handling |

</td>
</tr>
</table>

---

## 📁 Project Structure

```
CommunityCollab/
├── .gitignore
├── README.md
│
├── client/                          # React frontend (Vite)
│   ├── .env                         # Client environment variables
│   ├── .gitignore
│   ├── index.html                   # HTML entry point
│   ├── package.json
│   ├── vite.config.js               # Vite config with proxy settings
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── postcss.config.js            # PostCSS config
│   ├── eslint.config.js             # ESLint configuration
│   ├── public/
│   └── src/
│       ├── main.jsx                 # React entry point
│       ├── App.jsx                  # Root component with routes
│       ├── index.css                # Global styles
│       ├── assets/
│       │   └── hero.png             # Landing page hero image
│       ├── components/
│       │   ├── Navbar.jsx           # Top navigation bar
│       │   ├── Sidebar.jsx          # Side navigation (desktop)
│       │   ├── MobileNav.jsx        # Bottom navigation (mobile)
│       │   ├── Footer.jsx           # Page footer
│       │   ├── ProtectedRoute.jsx   # Auth guard for routes
│       │   ├── TrustBadge.jsx       # Trust score display badge
│       │   └── LegalNoticeModal.jsx # Legal agreement modal
│       ├── context/
│       │   ├── AuthContext.jsx      # Authentication state provider
│       │   └── SocketContext.jsx    # Socket.IO connection provider
│       ├── pages/
│       │   ├── Landing.jsx          # Public landing page
│       │   ├── Login.jsx            # Login page
│       │   ├── Register.jsx         # Registration page
│       │   ├── Dashboard.jsx        # Main dashboard
│       │   ├── Events.jsx           # Events listing
│       │   ├── EventDetail.jsx      # Single event view
│       │   ├── Pools.jsx            # Pool ordering listing
│       │   ├── PoolDetail.jsx       # Single pool view (largest page)
│       │   ├── Skills.jsx           # Skill exchange listing
│       │   ├── SkillDetail.jsx      # Single skill view
│       │   ├── Resources.jsx        # Resource sharing listing
│       │   ├── ResourceDetail.jsx   # Single resource view
│       │   ├── Assistance.jsx       # Assistance posts listing
│       │   ├── AssistanceDetail.jsx # Single assistance post view
│       │   ├── Messages.jsx         # Real-time messaging
│       │   ├── Notifications.jsx    # Notifications center
│       │   ├── Profile.jsx          # User profile editor
│       │   └── Leaderboard.jsx      # Community leaderboard
│       └── services/
│           └── api.js               # Axios instance configuration
│
├── server/                          # Express backend
│   ├── .env                         # Server environment variables
│   ├── package.json
│   ├── server.js                    # Express app entry point
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── middleware/
│   │   └── auth.middleware.js       # JWT authentication middleware
│   ├── models/
│   │   ├── User.js                  # User model with bcrypt
│   │   ├── Event.js                 # Event model
│   │   ├── PoolRequest.js           # Pool request model
│   │   ├── PoolItem.js              # Pool item model
│   │   ├── SkillListing.js          # Skill listing model
│   │   ├── SkillConnection.js       # Skill connection model
│   │   ├── Resource.js              # Resource model
│   │   ├── AssistancePost.js        # Assistance post model
│   │   ├── Message.js               # Chat message model
│   │   └── Notification.js          # Notification model
│   ├── routes/
│   │   ├── auth.routes.js           # Login & register
│   │   ├── user.routes.js           # User profile & search
│   │   ├── pool.routes.js           # Pool CRUD + ordering flow
│   │   ├── event.routes.js          # Event CRUD + join/leave
│   │   ├── skill.routes.js          # Skill listings + connections
│   │   ├── resource.routes.js       # Resource CRUD + borrow flow
│   │   ├── assistance.routes.js     # Assistance CRUD + responses
│   │   ├── chat.routes.js           # Message history & rooms
│   │   ├── notification.routes.js   # Notification management
│   │   ├── leaderboard.routes.js    # Community leaderboard
│   │   └── map.routes.js            # Map pins API
│   ├── sockets/
│   │   └── socket.js                # Socket.IO server setup
│   ├── utils/
│   │   ├── jwt.js                   # JWT token signing
│   │   ├── mailer.js                # Nodemailer + email templates
│   │   ├── trustEngine.js           # Trust score calculation
│   │   └── badgeEngine.js           # Badge & points system
│   ├── seed/
│   │   └── seed.js                  # Database seeder
│   └── uploads/
│       └── pool-proofs/             # Pool order proof screenshots
│
└── stitch/                          # Project screenshots & demos
```

---

## ✅ Prerequisites

Before you begin, make sure you have the following installed:

| Prerequisite | Minimum Version | Download Link | Verify Command |
|-------------|----------------|---------------|----------------|
| **Node.js** | 18.x or higher | [nodejs.org](https://nodejs.org/) | `node --version` → should output `v18.x.x` or higher |
| **npm** | 9.x or higher | Comes with Node.js | `npm --version` → should output `9.x.x` or higher |
| **MongoDB** | 6.x or higher | [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) OR [MongoDB Atlas](https://www.mongodb.com/atlas) for cloud | `mongosh --version` → should output `2.x.x` or higher |
| **Git** | Any recent version | [git-scm.com](https://git-scm.com/) | `git --version` → should output `git version 2.x.x` |
| **Gmail Account** | — | [myaccount.google.com](https://myaccount.google.com/) | Must have **2-Step Verification** enabled for App Passwords |
| **Razorpay** (optional) | — | [dashboard.razorpay.com](https://dashboard.razorpay.com/) | Only needed if payment gateway features are re-enabled; currently using UPI manual flow |

---

## 🚀 Getting Started

### Step 1 — Clone the Repository

```bash
git clone https://github.com/yourusername/CommunityCollab.git
cd CommunityCollab
```

---

### Step 2 — Install Server Dependencies

```bash
cd server
npm install
```

This installs the following packages:

| Package | Purpose |
|---------|---------|
| `express` | Web server framework |
| `mongoose` | MongoDB ODM |
| `socket.io` | WebSocket server for real-time features |
| `jsonwebtoken` | JWT token creation and verification |
| `bcryptjs` | Password hashing with bcrypt |
| `nodemailer` | Send emails via SMTP |
| `multer` | Handle multipart file uploads |
| `express-rate-limit` | Rate limiting middleware |
| `joi` | Request payload validation |
| `cors` | Cross-origin resource sharing |
| `dotenv` | Load `.env` variables into `process.env` |
| `express-async-errors` | Catch async errors without try/catch |
| `axios` | HTTP client (used for URL scraping) |
| `cheerio` | HTML parser (used to extract product metadata from URLs) |
| `razorpay` | Razorpay SDK (currently inactive — UPI flow used) |
| `nodemon` (dev) | Auto-restart server on file changes |

---

### Step 3 — Install Client Dependencies

```bash
cd ../client
npm install
```

This installs the following packages:

| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI library |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client for API calls |
| `socket.io-client` | Socket.IO client for real-time communication |
| `@tanstack/react-query` | Server state management, caching, and data fetching |
| `date-fns` | Date formatting and manipulation |
| `@vitejs/plugin-react` (dev) | Vite plugin for React |
| `tailwindcss` (dev) | Utility-first CSS framework |
| `autoprefixer` (dev) | PostCSS plugin for vendor prefixes |
| `postcss` (dev) | CSS transformation tool |
| `eslint` + plugins (dev) | Code linting |
| `vite` (dev) | Frontend build tool and dev server |

---

### Step 4 — MongoDB Setup

Choose **one** of the two options below:

#### Option A — Local MongoDB

1. Install MongoDB Community Edition from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Start the MongoDB service:
   - **macOS** (Homebrew):
     ```bash
     brew services start mongodb-community
     ```
   - **Windows**:
     ```bash
     net start MongoDB
     ```
   - **Linux**:
     ```bash
     sudo systemctl start mongod
     ```
3. Verify it is running:
   ```bash
   mongosh
   ```
   This should open the MongoDB shell. Type `exit` to close it.
4. The database `communitycollab` will be created automatically when the seed script runs — **no manual creation needed**.

#### Option B — MongoDB Atlas (Cloud)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a new cluster — choose the **free M0 tier**
3. Click **Connect** → **Connect your application** → copy the connection string
4. Replace `<password>` in the connection string with your Atlas database user password
5. Replace `<dbname>` with `communitycollab`
6. Whitelist your IP address: go to **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (for development only)
7. Paste the full connection string as the value of `MONGO_URI` in your `server/.env` file

---

### Step 5 — Gmail SMTP Setup (Required for Email Notifications)

> **This step is required.** The app sends emails when users join pools, register for events, connect for skills, submit borrow requests, and respond to assistance posts. If SMTP is not configured, these actions will still work but no emails will be sent.

1. Go to your Google Account at [myaccount.google.com](https://myaccount.google.com/)
2. Click **Security** in the left sidebar
3. Scroll to **"How you sign in to Google"** and make sure **2-Step Verification** is **ON**. If it is off, enable it first — App Passwords will not appear without this
4. After enabling 2-Step Verification, go back to **Security** and search for **"App passwords"** in the search bar at the top of the page
5. Click **App passwords**
6. In the **"Select app"** dropdown choose **"Mail"**
7. In the **"Select device"** dropdown choose **"Other (Custom name)"** and type `CommunityCollab`
8. Click **Generate**
9. Google will show a **16-character password** like `abcd efgh ijkl mnop` — copy this exactly (with or without spaces — both work)
10. This password goes into `EMAIL_PASS` in your `server/.env` file
11. Your Gmail address goes into `EMAIL_USER`

> ⚠️ **WARNING:** If you use your real Gmail password instead of an App Password, Gmail will block the login and emails will fail with an authentication error. **Always use the App Password** generated above.

---

### Step 6 — Environment Variables Setup

Two `.env` files are needed — one in `server/` and one in `client/`.

#### Create `server/.env`

```bash
cd server
touch .env
```

Paste the following into `server/.env`:

```env
# ─── SERVER ───────────────────────────────────────────────
PORT=5000

# ─── DATABASE ─────────────────────────────────────────────
# For local MongoDB:
MONGO_URI=mongodb://localhost:27017/communitycollab
# For MongoDB Atlas (replace with your connection string):
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/communitycollab

# ─── JWT ──────────────────────────────────────────────────
# Change this to any long random string in production
# Generate one at: https://randomkeygen.com
JWT_SECRET=communitycollab_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# ─── CLIENT URL (for CORS) ────────────────────────────────
# This must match the URL where your React app runs
CLIENT_URL=http://localhost:5173

# ─── EMAIL / SMTP (Gmail) ─────────────────────────────────
# Your Gmail address
EMAIL_USER=youremail@gmail.com
# The 16-character App Password from Google (see Setup Step 5)
EMAIL_PASS=abcdefghijklmnop
# Gmail SMTP settings — do not change these
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
# Display name shown in emails received by users
EMAIL_FROM=CommunityCollab <youremail@gmail.com>
```

#### Create `client/.env`

```bash
cd ../client
touch .env
```

Paste the following into `client/.env`:

```env
# ─── API BASE URL ─────────────────────────────────────────
# Must match the PORT in server/.env
VITE_API_URL=http://localhost:5000/api/v1

# ─── SOCKET URL ───────────────────────────────────────────
# Must match the PORT in server/.env
VITE_SOCKET_URL=http://localhost:5000
```

> ⚠️ **WARNING:** Never commit `.env` files to Git. They are already in `.gitignore`. If you accidentally push them, **rotate your JWT secret** and **regenerate your Gmail App Password** immediately.

---

### Step 7 — Create Required Directories

Some directories are in `.gitignore` and will not exist after cloning. Run these commands from the project root:

```bash
mkdir -p server/uploads/pool-proofs
```

This directory is where pool order proof screenshots are stored when uploaded by the pool orderer.

---

### Step 8 — Seed the Database

The seed file wipes **all** existing data and inserts fresh test data including:
- **5 users** (1 admin, 2 organizers, 2 regular users)
- **4 events** (cleanup, health camp, charity, workshop)
- **4 pools** with **8 pool items** (groceries, carpool, subscription, organic co-op)
- **5 skill listings** (offering and seeking)
- **2 resources** (tool and workspace)
- **2 assistance posts** (requesting and offering)
- Trust scores recalculated for all users

Run the following commands:

```bash
cd server
npm run seed
```

**Expected console output:**

```
Connected to MongoDB for seeding...

✓ Cleared all collections
✓ Created 5 users
✓ Created 4 events
✓ Created 4 pool requests
✓ Created 8 pool items
✓ Created 5 skill listings
✓ Created 2 resources
✓ Created 2 assistance posts
✓ Trust scores recalculated for all 5 users

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  COMMUNITYCOLLAB — DATABASE SEEDED SUCCESSFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TEST LOGIN CREDENTIALS
  ─────────────────────────────────────────────
  ADMIN     → admin@communitycollab.com  | Admin@1234
  ORGANIZER → priya@test.com             | Test@1234
  ORGANIZER → aisha@test.com             | Test@1234
  USER      → rahul@test.com             | Test@1234
  USER      → dev@test.com               | Test@1234
  ─────────────────────────────────────────────

  COLLECTIONS CLEARED AND RESEEDED:
  Users, Events, PoolRequests, PoolItems,
  SkillListings, SkillConnections, SkillSessions,
  SkillReviews, Resources, AssistancePosts,
  Notifications, Messages

  Trust scores recalculated for all 5 users.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> ⚠️ **WARNING:** Running the seed again will **delete all existing data** and start fresh. Do not run it on a production database.

---

### Step 9 — Run the Application

You need **two terminals** — one for the server and one for the client.

#### Terminal 1 — Server

```bash
cd server
npm run dev
```

**Expected output:**

```
[Mail] Initializing transporter...
[Mail] ✅ SMTP connection verified — ready to send
Server running on port 5000
MongoDB Connected: localhost
```

#### Terminal 2 — Client

```bash
cd client
npm run dev
```

**Expected output:**

```
  VITE v5.x.x  ready in 200 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open **http://localhost:5173** in your browser. 🎉

---

## 👥 Test Login Credentials

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Admin** | `admin@communitycollab.com` | `Admin@1234` | Full platform access |
| **Organizer** | `priya@test.com` | `Test@1234` | Can create events and pools |
| **Organizer** | `aisha@test.com` | `Test@1234` | Can create events and pools |
| **User** | `rahul@test.com` | `Test@1234` | Standard user access |
| **User** | `dev@test.com` | `Test@1234` | Standard user access |

> 💡 **Tip:** To test the full pool payment flow, open two different browsers (or one normal and one incognito window) and log in as different users.

---

## 🎯 Features Walkthrough

### 🛒 Group Pool Ordering

Pool ordering lets community members combine their individual purchases into a single order to save on delivery fees, unlock bulk discounts, or coordinate group buys. The pool creator opens a pool, others join and paste their own product links with quantities and prices, and a designated orderer places the combined order on the chosen platform. After delivery, participants confirm receipt and settle payment via UPI.

- Create a pool for any platform (DMart, Amazon, Flipkart, Swiggy, Blinkit, Zepto, or custom)
- Join existing open pools and add your product links
- Auto-scrape product name and image from pasted URLs
- Lock the pool when ready, then submit order proof (screenshot, order ID, tracking URL)
- Confirm delivery and submit UPI payment with UTR tracking
- Per-item status updates: ordered, out of stock, substituted, delivered

### 📚 Skill Exchange

Skill Exchange connects people who want to teach with people who want to learn. You can offer skills you're proficient in or seek skills you want to learn. Sessions can be free, paid (per hour), or barter (exchange one skill for another). After both parties complete the session, payment (if applicable) is settled via UPI.

- List a skill offering or seeking with category, proficiency level, and mode (online/in-person/both)
- Set exchange type: free, paid with hourly rate, or barter
- Browse and search skills by category, mode, and exchange type
- Send connection requests with a personal message
- Accept/reject connections; mark session complete by both parties
- Set UPI details, submit UTR, and confirm payment for paid sessions
- Find mutual matches — people seeking what you offer

### 🎪 Community Events

Community Events handles the full lifecycle of organizing community activities — from charity drives and fundraisers to workshops and cleanup campaigns. Organizers create events with location, date, volunteer limits, and tasks. Participants register, get email confirmations, and can be assigned event tasks.

- Create events with category (charity, cleanup, workshop, health, fundraiser, social)
- Set cover images, date/time, location with coordinates, and volunteer limits
- Register as a volunteer or participant
- Organizer can create tasks, assign them to volunteers, and track completion
- Email notification sent to participants on registration
- Leave events with organizer notification

### 🔧 Resource Sharing

Resource Sharing lets community members lend tools, workspaces, vehicles, and other items they don't use all the time. Owners list their resources with condition, availability, and whether it's free or has a daily rental price. Borrowers send requests with dates, owners approve or reject, and the UPI payment flow handles any charges after the item is returned.

- List resources: tools, workspaces, vehicles, meals, groceries, and more
- Specify condition (new, good, fair), availability, and price per day
- Browse and filter by type, free/paid, and status
- Send borrow requests with dates and a message
- Owner approves/rejects — email notification sent on request
- Borrower marks returned → owner confirms → UPI payment if applicable

### 🤝 Direct Assistance

Direct Assistance is for one-to-one help — both offering and requesting. Whether you need someone to pick up a prescription, want free tutoring, or can offer eldercare help, this module connects helpers with those who need them. Responses can be accepted, and urgent posts earn responders extra community points.

- Post help offers (tutoring, delivery, errands, eldercare, petcare, etc.)
- Post help requests with urgency level (low, medium, urgent)
- Browse by category, urgency, and post type
- Respond to posts with a message
- Poster accepts the best response — other responses auto-rejected
- Email notification on new responses

### 💬 Real-Time Messaging

Messaging is powered by Socket.IO and supports both group chats (for pools, events, and skill connections) and direct messages between any two users. Messages are persisted in MongoDB and loaded with pagination. Typing indicators, online presence tracking, and DM notifications make conversations feel instant and alive.

- Group chat rooms for pools, events, and skill connections
- Direct messages (DM) between any two users
- Search for users by name or email to start a new DM
- Real-time typing indicators
- Online user tracking per room
- Message persistence with paginated history
- DM notification when recipient is not in the chat room

---

## 📡 API Documentation

All endpoints are prefixed with `/api/v1`.

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Login and receive JWT token | No |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/users/me` | Get current logged-in user | Yes |
| `GET` | `/users` | Search users by name or email (query param `q`) | Yes |
| `GET` | `/users/:id` | Get a user's public profile | No |
| `PATCH` | `/users/me` | Update current user's profile | Yes |

### Pools

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/pools` | List all pools (filterable by type, status, platform, tags, search) | No |
| `POST` | `/pools` | Create a new pool | Yes |
| `GET` | `/pools/:id` | Get pool details with items | No |
| `PATCH` | `/pools/:id` | Update pool (creator only) | Yes |
| `DELETE` | `/pools/:id` | Cancel pool (creator only) | Yes |
| `POST` | `/pools/:id/join` | Join a pool | Yes |
| `POST` | `/pools/:id/leave` | Leave a pool | Yes |
| `PATCH` | `/pools/:id/designate-orderer` | Designate the orderer (creator only) | Yes |
| `PATCH` | `/pools/:id/lock` | Lock pool for ordering (open → ordering) | Yes |
| `POST` | `/pools/:id/submit-proof` | Submit order proof with screenshot (multipart) | Yes |
| `POST` | `/pools/:id/confirm-delivery` | Confirm delivery received | Yes |
| `POST` | `/pools/:id/submit-utr` | Submit UTR payment reference | Yes |
| `PATCH` | `/pools/:id/confirm-payment/:participantUserId` | Confirm payment received (orderer only) | Yes |
| `GET` | `/pools/:id/order-summary` | Get consolidated order summary | Yes |
| `POST` | `/pools/fetch-meta` | Fetch product name/image from URL | Yes |

### Pool Items

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/pools/:id/items` | Get all items in a pool (grouped by user) | Yes |
| `POST` | `/pools/:id/items` | Add an item to a pool | Yes |
| `PATCH` | `/pools/:id/items/:itemId` | Edit own item | Yes |
| `DELETE` | `/pools/:id/items/:itemId` | Remove an item (own or creator) | Yes |
| `PATCH` | `/pools/:id/items/:itemId/status` | Update item status (orderer only) | Yes |

### Skills

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/skills` | List all skill listings (filterable) | No |
| `POST` | `/skills` | Create a skill listing | Yes |
| `GET` | `/skills/:id` | Get skill listing details | No |
| `PATCH` | `/skills/:id` | Update own skill listing | Yes |
| `DELETE` | `/skills/:id` | Delete own skill listing | Yes |
| `GET` | `/skills/mutual-matches` | Find mutual skill matches | Yes |
| `GET` | `/skills/connections` | Get connections for current user | Yes |
| `POST` | `/skills/:id/connect` | Request a skill connection | Yes |
| `PATCH` | `/skills/connections/:id/accept` | Accept connection (teacher) | Yes |
| `PATCH` | `/skills/connections/:id/reject` | Reject connection (teacher) | Yes |
| `PATCH` | `/skills/connections/:id/complete` | Mark session complete | Yes |
| `POST` | `/skills/connections/:id/set-upi` | Set UPI details (teacher) | Yes |
| `POST` | `/skills/connections/:id/submit-utr` | Submit UTR (learner) | Yes |
| `PATCH` | `/skills/connections/:id/confirm-payment` | Confirm payment (teacher) | Yes |

### Events

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/events` | List events (filterable by category, date, status, tags, search) | No |
| `POST` | `/events` | Create an event | Yes |
| `GET` | `/events/:id` | Get event details | No |
| `PATCH` | `/events/:id` | Update event (organizer only) | Yes |
| `DELETE` | `/events/:id` | Delete event (organizer only) | Yes |
| `POST` | `/events/:id/join` | Register for an event | Yes |
| `POST` | `/events/:id/leave` | Leave an event | Yes |
| `PATCH` | `/events/:id/tasks/:taskId` | Update an event task (organizer only) | Yes |

### Resources

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/resources` | List all resources (filterable) | No |
| `POST` | `/resources` | Create a resource listing | Yes |
| `GET` | `/resources/:id` | Get resource details | No |
| `PATCH` | `/resources/:id` | Update own resource | Yes |
| `DELETE` | `/resources/:id` | Delete own resource | Yes |
| `POST` | `/resources/:id/request` | Send borrow request | Yes |
| `PATCH` | `/resources/:id/requests/:requestId/approve` | Approve borrow request (owner) | Yes |
| `PATCH` | `/resources/:id/requests/:requestId/reject` | Reject borrow request (owner) | Yes |
| `POST` | `/resources/:id/requests/:requestId/return` | Mark item returned (borrower) | Yes |
| `POST` | `/resources/:id/requests/:requestId/submit-utr` | Submit UTR (borrower) | Yes |
| `PATCH` | `/resources/:id/requests/:requestId/confirm-payment` | Confirm payment (owner) | Yes |

### Assistance

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/assistance` | List all assistance posts (filterable) | No |
| `POST` | `/assistance` | Create an assistance post | Yes |
| `GET` | `/assistance/:id` | Get post details | No |
| `POST` | `/assistance/:id/respond` | Respond to a post | Yes |
| `PATCH` | `/assistance/:id/responses/:responseId/accept` | Accept a response (poster only) | Yes |
| `DELETE` | `/assistance/:id` | Delete own post | Yes |

### Messages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/chat/rooms` | Get all chat rooms for current user | Yes |
| `GET` | `/chat/:room` | Get message history for a room (paginated) | Yes |
| `POST` | `/chat` | Send a message via REST (fallback) | Yes |

### Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/notifications` | Get all notifications (paginated) | Yes |
| `GET` | `/notifications/unread-count` | Get unread notification count | Yes |
| `PATCH` | `/notifications/:id/read` | Mark a notification as read | Yes |
| `PATCH` | `/notifications/read-all` | Mark all notifications as read | Yes |
| `DELETE` | `/notifications/clear` | Delete all read notifications | Yes |

### Leaderboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/leaderboard` | Get top users by community points (filterable by period: week, month) | No |

### Map

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/map/pins` | Get map pins for events, pools, and skills | No |

### Health

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/health` | Health check | No |

---

## 🔌 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ room }` | Join a chat room (pool, event, skill_connection, or dm) |
| `leave_room` | `{ room }` | Leave a chat room |
| `send_message` | `{ room, content, type?, card_data? }` | Send a message to a room |
| `typing_start` | `{ room }` | Broadcast typing indicator to room |
| `typing_stop` | `{ room }` | Stop typing indicator |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ userId, name }` | Emitted immediately after successful socket connection |
| `new_message` | `Message object (populated)` | New message in a joined room |
| `user_typing` | `{ userId, name }` | A user started typing in the room |
| `user_stopped_typing` | `{ userId }` | A user stopped typing |
| `room_users` | `{ room, users[] }` | Updated list of online users in a room |
| `message_error` | `{ error }` | Error sending a message |
| `notification:new` | `{ notification }` | New notification for the user |
| `pool:participant_joined` | `{ poolId, poolTitle, joinerName, totalParticipants }` | Someone joined a pool |
| `pool:participant_left` | `{ poolId, poolTitle, userName }` | Someone left a pool |
| `pool:locked` | `{ poolId, poolTitle, message }` | Pool locked for ordering |
| `pool:order_placed` | `{ poolId, poolTitle, ordererName }` | Order proof submitted |
| `pool:item_added` | `{ poolId, poolTitle, itemName, addedBy }` | New item added to pool |
| `pool:item_status_updated` | `{ poolId, itemName, status, orderer_note }` | Item status changed |
| `pool:delivery_confirmed` | `{ poolId, confirmedBy, allConfirmed }` | Participant confirmed delivery |
| `pool:utr_submitted` | `{ notification, poolId, poolTitle, participantName, utrNumber }` | UTR payment submitted |
| `pool:payment_confirmed` | `{ notification, poolId, poolTitle }` | Payment confirmed by orderer |
| `pool:cancelled` | `{ poolId, poolTitle }` | Pool was cancelled |
| `pool:designated_orderer` | `{ poolId, poolTitle }` | You were designated as the orderer |
| `skill:connection_request` | `{ learnerName, skillName, connectionId }` | New connection request |
| `skill:connection_accepted` | `{ teacherName, skillName, connectionId, exchangeType }` | Connection accepted |
| `skill:connection_rejected` | `{ notification, connectionId }` | Connection rejected |
| `skill:session_completed` | `{ notification }` | Skill session marked complete |
| `skill:utr_submitted` | `{ notification }` | UTR submitted for skill session |
| `skill:payment_confirmed` | `{ notification }` | Payment confirmed for skill session |
| `resource:borrow_request` | `{ requesterName, resourceTitle }` | New borrow request |
| `resource:request_approved` | `{ notification }` | Borrow request approved |
| `resource:request_rejected` | `{ notification }` | Borrow request rejected |
| `resource:item_returned` | `{ notification }` | Item marked as returned |
| `resource:utr_submitted` | `{ notification }` | UTR submitted for resource |
| `resource:payment_confirmed` | `{ notification }` | Payment confirmed for resource |
| `event:new_participant` | `{ eventId, user }` | New participant registered |
| `event:participant_left` | `{ eventId, eventTitle, userName }` | Participant left event |
| `event:cancelled` | `{ eventId, eventTitle }` | Event was cancelled |
| `event:task_assigned` | `{ notification }` | Task assigned to you |
| `event:task_updated` | `{ eventId, taskTitle, status }` | Task status updated |
| `assistance:new_response` | `{ notification }` | New response to assistance post |
| `assistance:response_accepted` | `{ notification }` | Your response was accepted |

---

## 📋 Environment Variables Reference

| Variable | File | Required | Description | Example Value |
|----------|------|----------|-------------|---------------|
| `PORT` | `server/.env` | Yes | Server listening port | `5000` |
| `MONGO_URI` | `server/.env` | Yes | MongoDB connection string | `mongodb://localhost:27017/communitycollab` |
| `JWT_SECRET` | `server/.env` | Yes | Secret key for signing JWT tokens | `communitycollab_super_secret_jwt_key_change_this_in_production` |
| `JWT_EXPIRE` | `server/.env` | Yes | JWT token expiration duration | `7d` |
| `CLIENT_URL` | `server/.env` | Yes | Frontend URL for CORS origin | `http://localhost:5173` |
| `EMAIL_USER` | `server/.env` | Yes | Gmail address for sending emails | `youremail@gmail.com` |
| `EMAIL_PASS` | `server/.env` | Yes | Gmail App Password (16 characters) | `abcdefghijklmnop` |
| `EMAIL_HOST` | `server/.env` | Yes | SMTP hostname | `smtp.gmail.com` |
| `EMAIL_PORT` | `server/.env` | Yes | SMTP port | `587` |
| `EMAIL_FROM` | `server/.env` | Yes | Display name + email in outgoing mail | `CommunityCollab <youremail@gmail.com>` |
| `RAZORPAY_KEY_ID` | `server/.env` | No | Razorpay test/live key ID (currently unused) | `rzp_test_xxxxxxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | `server/.env` | No | Razorpay secret key (currently unused) | `xxxxxxxxxxxxxxxx` |
| `VITE_API_URL` | `client/.env` | Yes | Backend API base URL | `http://localhost:5000/api/v1` |
| `VITE_SOCKET_URL` | `client/.env` | Yes | Socket.IO server URL | `http://localhost:5000` |

---

## 🛡 Trust Score System

Every user has a **Trust Score** (0–100) that reflects their reliability and community contribution. It is automatically recalculated after key actions like completing pool payments, finishing skill sessions, or returning borrowed items.

### Scoring Factors

| Factor | Points |
|--------|--------|
| Phone number set | +15 |
| Email verified | +5 |
| Profile avatar set | +5 |
| Bio longer than 30 characters | +5 |
| Community points above 100 | +5 |
| Community points above 300 | +5 |
| Community points above 500 | +5 |
| Each completed pool payment (max 5) | +3 each |
| Each completed skill session (max 5) | +3 each |
| Each completed resource return (max 3) | +3 each |
| Average review rating ≥ 4 stars | +10 |
| Average review rating 3 to 4 stars | +5 |
| Account older than 30 days | +3 |
| Account older than 90 days | +3 |
| Account older than 180 days | +4 |
| Zero open disputes | +5 |
| Each open dispute | **−15** |
| UTR unconfirmed beyond 48 hours (auto-disputed) | **−10** (via trust recalculation) |
| Incomplete profile (no phone, bio, or avatar) | **−10** |

### Trust Level Thresholds

| Score | Level | Badge Color |
|-------|-------|-------------|
| 0 – 20 | New | Grey |
| 21 – 40 | Low | Red |
| 41 – 60 | Moderate | Orange |
| 61 – 75 | Good | Amber |
| 76 – 89 | Trusted | Teal |
| 90 – 100 | ★ Verified Community Member | Gold |

---

## 💸 UPI Payment Flow

CommunityCollab uses a **manual UPI payment verification** system. No payment gateway is required — payments are made directly between users via any UPI app (Google Pay, PhonePe, Paytm, etc.), and the payer submits their UTR (Unique Transaction Reference) number for the receiver to verify.

### Pool Payment Flow

1. Pool creator opens a pool and participants join, adding their product links
2. Creator locks the pool (status: `open` → `ordering`)
3. Designated orderer places the combined order on the platform and submits proof (screenshot, order URL, order ID)
4. Pool moves to `ordered` status — all participants are notified via socket + email
5. Each participant **confirms delivery** of their items
6. Orderer shares their **UPI ID** and **UPI name** in the order proof
7. After confirming delivery, each participant pays the orderer via UPI and submits the **UTR number** in the app
8. Orderer verifies each UTR in their UPI app and clicks **Confirm Payment** for that participant
9. Participant's payment status moves from `utr_submitted` → `paid`
10. If UTR remains unconfirmed for 48+ hours, status auto-changes to `disputed` and trust score is penalized

### Skill Payment Flow (Paid Sessions)

1. Learner sends connection request → teacher accepts
2. Both parties conduct the session
3. Both learner and teacher mark session as **complete**
4. Teacher sets their **UPI ID** and **UPI name**
5. Learner pays via UPI and submits the **UTR number**
6. Teacher verifies and clicks **Confirm Payment**
7. Payment status moves to `paid`; trust scores are recalculated

### Resource Payment Flow (Paid Rentals)

1. Borrower sends a borrow request → owner approves (setting their UPI details)
2. Borrower uses the resource
3. Borrower marks the item as **returned**
4. Borrower pays any rental fee via UPI and submits the **UTR number**
5. Owner verifies and clicks **Confirm Payment**
6. Resource status returns to `available`; trust scores are recalculated

> 📌 **Key Principle:** Payment is **never** required before delivery/completion. The UPI payment step only unlocks after the receiving party confirms goods received or session completed. This protects both parties.

---

## ⚖️ Legal and Safety

### Community Agreement Modal

A **legal notice modal** appears on a user's first visit (per session) to the following pages:
- **Pools** / Pool Detail
- **Skills** / Skill Detail
- **Resources** / Resource Detail
- **Assistance** / Assistance Detail

The modal requires users to wait 4 seconds before they can agree, ensuring they read the notice. It is stored in `sessionStorage` so it reappears each new browser session.

### Full Legal Notice Text

> By participating in any activity on CommunityCollab — including pool orders, skill sessions, resource sharing, or assistance — you agree that all transactions are between individual users. CommunityCollab is a platform facilitating connections only.
>
> Any attempt to defraud, deceive, or harm another user — including placing fake orders, misrepresenting skills or resources, failing to deliver items paid for, or refusing to pay after receiving goods or services — may result in **permanent account suspension** and may be subject to legal action under applicable Indian law including the **Information Technology Act 2000** and Indian Penal Code sections related to fraud and cheating.
>
> Your activity is logged and timestamped. Your verified phone number and account details are on record.

### Persistent Warning Banner

Additionally, all detail pages (Pool Detail, Skill Detail, Resource Detail, Assistance Detail) display a persistent warning banner reminding users of the above agreement throughout their interaction.

---

## 🔧 Common Issues and Troubleshooting

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| MongoDB connection refused | MongoDB not running | Run `sudo systemctl start mongod` (Linux), `brew services start mongodb-community` (macOS), or start MongoDB Compass |
| Email not sending | Wrong App Password or 2FA not enabled | Regenerate App Password; ensure **2-Step Verification** is ON in your Google Account |
| CORS error in browser | `CLIENT_URL` mismatch | Make sure `CLIENT_URL` in `server/.env` exactly matches the Vite dev server URL including port (e.g., `http://localhost:5173`) |
| Socket not connecting | `VITE_SOCKET_URL` wrong | Must match server PORT exactly, no trailing slash |
| Seed fails with import error | Model file missing | Check all model files exist in `server/models/` |
| Trust scores all showing 50 | Seed ran before `trustEngine.js` was created | Create `trustEngine.js` first, then re-run seed with `npm run seed` |
| Uploads folder missing | Not created after clone | Run `mkdir -p server/uploads/pool-proofs` |
| Port 5000 already in use | Another process using port | Change `PORT` in `server/.env` to `5001` and update `VITE_API_URL` and `VITE_SOCKET_URL` accordingly |
| Vite proxy not working | `vite.config.js` proxy target wrong | Proxy target in `vite.config.js` must match server PORT |
| JWT expired error | Token older than 7 days | Log out and log back in, or change `JWT_EXPIRE` to a longer value like `30d` |

---

## 📜 Scripts Reference

### Server Scripts (`server/package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| Start production | `npm start` | Runs server with `node server.js` |
| Start development | `npm run dev` | Runs server with `nodemon` (auto-restart on changes) |
| Seed database | `npm run seed` | Wipes and re-seeds all collections with test data |

### Client Scripts (`client/package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| Start development | `npm run dev` | Starts Vite dev server at `localhost:5173` |
| Build production | `npm run build` | Builds optimized output to `dist/` |
| Preview build | `npm run preview` | Previews the production build locally |
| Lint | `npm run lint` | Runs ESLint on the codebase |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "Add your feature"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a **Pull Request** against the `main` branch
6. Ensure your code passes linting and does not break existing functionality

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 📬 Contact and Acknowledgements

Built by **[Your Name]** — [your.email@example.com]

GitHub: [github.com/yourusername/communitycollab](https://github.com/yourusername/communitycollab)

---

<p align="center">
  <strong>CommunityCollab</strong> — Collaborate. Share. Thrive Together. 🌍
</p>
