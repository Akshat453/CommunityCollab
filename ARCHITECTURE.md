# CommunityCollab - Complete Architecture & File Structure Documentation

## 1. Executive Summary

**CommunityCollab** is a full-stack, hyper-local community collaboration platform designed to foster neighborhood cooperation, resource sharing, skill exchange, group buying (pools), mutual assistance, and community event organization. 

The application utilizes a **MERN stack** architecture (MongoDB, Express.js, React 19, Node.js) supplemented by real-time WebSocket communication via **Socket.IO**, custom trust calculation algorithms, automated gamification badge engines, and Razorpay payment integration.

---

## 2. High-Level System Architecture

```
                                  +-------------------------------------------------------+
                                  |                    CLIENT LAYER                       |
                                  |   React 19 SPA (Vite) + Tailwind CSS + React Router   |
                                  |   State: AuthContext, SocketContext, TanStack Query   |
                                  +---------------------------+---------------------------+
                                                              |
                                           HTTPS / REST       |      WebSocket (Socket.IO)
                                              Requests        |       Real-Time Events
                                                              v
+-------------------------------------------------------------------------------------------------------------------+
|                                                 SERVER LAYER (Node.js + Express)                                  |
|                                                                                                                   |
|  +-------------------+  +--------------------+  +--------------------+  +-------------------+  +-----------------+  |
|  |  Auth Middleware  |  |   REST API Routes  |  |  Socket.IO Server  |  |   Trust Engine    |  |  Badge Engine   |  |
|  |   (JWT Verify)    |  | (/api/v1/* routes) |  | (Sockets & Notifs) |  | (Score 0-100 calc)|  | (Gamification)  |  |
|  +-------------------+  +--------------------+  +--------------------+  +-------------------+  +-----------------+  |
|                                                                                                                   |
+------------------+----------------------------------+----------------------------------+--------------------------+
                   |                                  |                                  |
                   v                                  v                                  v
        +----------------------+          +----------------------+            +----------------------+
        |      DATABASE        |          |   FILE STORAGE       |            | EXTERNAL SERVICES    |
        |  MongoDB (Mongoose)  |          | Static /uploads/     |            |  - Razorpay          |
        |                      |          | (Pool proofs, etc.)  |            |  - Nodemailer        |
        +----------------------+          +----------------------+            |  - Cheerio Scraper   |
                                                                              +----------------------+
```

---

## 3. Directory & File Structure

Below is the complete project directory structure:

```
CommunityCollab/
├── ARCHITECTURE.md                  # Comprehensive System Architecture Documentation
├── README.md                        # Project overview and quickstart instructions
│
├── client/                          # React Frontend Application (Vite Build)
│   ├── index.html                   # HTML template entry point
│   ├── vite.config.js               # Vite configuration (React plugin & server settings)
│   ├── tailwind.config.js           # Tailwind CSS configuration & theme tokens
│   ├── postcss.config.js            # PostCSS configuration for Tailwind integration
│   ├── eslint.config.js             # Code linting rules
│   ├── package.json                 # Client dependencies (React 19, React Query, Router v7)
│   ├── package-lock.json
│   ├── public/                      # Static assets
│   │   ├── favicon.svg              # Site favicon
│   │   └── icons.svg                # SVG icons asset sheet
│   └── src/                         # Source code
│       ├── main.jsx                 # Client entry point (React DOM root)
│       ├── App.jsx                  # Root App layout, Routing, Context Wrappers
│       ├── index.css                # Global Tailwind directives & custom CSS
│       ├── assets/                  # Images & vector graphics (hero.png, react.svg, vite.svg)
│       ├── components/              # Reusable UI Components
│       │   ├── Navbar.jsx           # Top navigation bar
│       │   ├── Sidebar.jsx          # Desktop sidebar navigation
│       │   ├── MobileNav.jsx        # Bottom navigation bar for mobile screens
│       │   ├── Footer.jsx           # Application footer
│       │   ├── ProtectedRoute.jsx   # Route guard enforcing authentication
│       │   ├── TrustBadge.jsx       # Visual badge component for user trust levels
│       │   └── LegalNoticeModal.jsx # Disclaimer & legal policy modal
│       ├── context/                 # Global Context Providers
│       │   ├── AuthContext.jsx      # Auth state, login/logout, user token persistence
│       │   └── SocketContext.jsx    # Socket.IO connection & real-time notification listener
│       ├── pages/                   # Application Pages & Screens
│       │   ├── Landing.jsx          # Public landing page
│       │   ├── Login.jsx            # User authentication (Login)
│       │   ├── Register.jsx         # User registration page
│       │   ├── Dashboard.jsx        # Personalized main user dashboard
│       │   ├── Events.jsx           # Community events listing
│       │   ├── EventDetail.jsx      # Single event detail & RSVP management
│       │   ├── Pools.jsx            # Group buying pools listing
│       │   ├── PoolDetail.jsx       # Single pool detail, participation, & proof upload
│       │   ├── Skills.jsx           # Skill exchange listings (Offers/Requests)
│       │   ├── SkillDetail.jsx      # Skill detail & connection management
│       │   ├── Resources.jsx        # Resource sharing directory (Lend/Borrow)
│       │   ├── ResourceDetail.jsx   # Single resource detail & request booking
│       │   ├── Assistance.jsx       # Emergency & neighborhood help request feed
│       │   ├── AssistanceDetail.jsx # Single assistance post detail & response
│       │   ├── Messages.jsx         # Real-time direct messaging chat interface
│       │   ├── Notifications.jsx    # Notification center feed
│       │   ├── Profile.jsx          # User profile view/edit, badges, & trust score
│       │   └── Leaderboard.jsx      # Community leaderboard by points & trust
│       └── services/                # API Client Layer
│           └── api.js               # Axios instance with auth interceptors & endpoints
│
├── server/                          # Node.js + Express Backend Application
│   ├── server.js                    # Server entry point (Express app & HTTP/Socket server)
│   ├── package.json                 # Server dependencies (Express, Mongoose, Socket.io, Multer)
│   ├── package-lock.json
│   ├── config/                      # System Configurations
│   │   └── db.js                    # Mongoose database connection setup
│   ├── middleware/                  # Custom Express Middlewares
│   │   └── auth.middleware.js       # JWT authentication & route authorization
│   ├── models/                      # MongoDB Mongoose Data Schemas
│   │   ├── User.js                  # User accounts, trust scores, points & badges
│   │   ├── PoolItem.js              # Group purchase items/deals
│   │   ├── PoolRequest.js           # Active pool instances & participant payment status
│   │   ├── SkillListing.js          # Offered & requested skill listings
│   │   ├── SkillConnection.js       # Skill match/exchange sessions
│   │   ├── Resource.js              # Physical items available for borrowing/lending
│   │   ├── AssistancePost.js        # Urgent help requests & assistance posts
│   │   ├── Event.js                 # Local community events & RSVPs
│   │   ├── Message.js               # Chat messages between users
│   │   └── Notification.js         # User notification alerts
│   ├── routes/                      # REST API Endpoint Handlers
│   │   ├── auth.routes.js           # Auth (Register, Login, Me)
│   │   ├── user.routes.js           # User profiles & leaderboards
│   │   ├── event.routes.js          # Event CRUD & RSVP handling
│   │   ├── pool.routes.js           # Group buying pool creation, joining, payment & verification
│   │   ├── skill.routes.js          # Skill listing creation & connection requests
│   │   ├── resource.routes.js       # Resource lending/borrowing requests
│   │   ├── assistance.routes.js     # Assistance posts & response handlers
│   │   ├── chat.routes.js           # Messaging history & chat threads
│   │   ├── notification.routes.js   # User notification fetch & mark-as-read
│   │   ├── leaderboard.routes.js    # Leaderboard rankings
│   │   └── map.routes.js            # Geolocation-based community map endpoints
│   ├── sockets/                     # Real-Time WebSocket Logic
│   │   └── socket.js                # Socket.IO connection handling & real-time emitters
│   ├── utils/                       # Business Logic & Utility Engines
│   │   ├── trustEngine.js           # Dynamic Trust Score & Trust Level calculation
│   │   ├── badgeEngine.js           # Gamification points & badge distribution engine
│   │   ├── jwt.js                   # JWT token sign & verify utilities
│   │   └── mailer.js                # Nodemailer email dispatch utility
│   ├── seed/                        # Database Seeding
│   │   └── seed.js                  # Initial mock data seeder
│   └── uploads/                     # Upload directory for static media
│       └── pool-proofs/             # Payment & receipt verification proof images
│
└── stitch/                          # UI Screen Mockups & HTML Prototypes
    ├── main_dashboard/              # Dashboard prototype layout & screenshot
    ├── group_buy_pools/             # Group buy pools prototype screen
    ├── skill_exchange/              # Skill exchange prototype screen
    ├── community_events/            # Community events prototype screen
    ├── notifications/               # Notifications screen prototype
    ├── user_profile/                # User profile screen prototype
    ├── messages/                    # Messaging prototype layout
    ├── landing_page/                # Landing page mockup
    ├── warm_hearth_collective/      # Design system documentation (DESIGN.md)
    └── communitycollab_flow/        # Full user flow prototype HTML
```

---

## 4. Architectural Modules Breakdown

### 4.1 Client Architecture (React 19 SPA)
- **Vite Bundler**: Fast development server and optimized build process.
- **Routing**: `react-router-dom` v7 with central configuration in [App.jsx](file:///Users/akshatsingh/Desktop/CommunityCollab/client/src/App.jsx). Routes are split into public (`/`, `/login`, `/register`) and protected routes wrapped in [ProtectedRoute.jsx](file:///Users/akshatsingh/Desktop/CommunityCollab/client/src/components/ProtectedRoute.jsx).
- **State Management**:
  - **AuthContext**: Persists user session in `localStorage` and provides global auth state.
  - **SocketContext**: Establishes a persistent Socket.IO connection upon user authentication to listen for live notifications and instant messages.
  - **TanStack React Query**: Manages server state caching, revalidation, and optimistic updates.
- **Styling**: Tailwind CSS configured with a custom color palette, surface tokens, and responsive layout classes (`md:ml-64` desktop sidebar + mobile bottom nav).

### 4.2 Server Architecture (Node.js / Express REST API)
- **Express Server**: Configured with CORS, JSON body parser (10MB limit for image uploads), static file serving from `/uploads`, and standard global error middleware.
- **Routes & Handlers**: Endpoint handlers are registered under `/api/v1/` prefixes in [server.js](file:///Users/akshatsingh/Desktop/CommunityCollab/server/server.js).

### 4.3 Database Schemas & Data Layer (MongoDB / Mongoose)

1. **User Schema**: User credentials, location (coordinates/address), profile detail, rating, trust score (`trust_score`, `trust_level`), community points, and array of earned badges.
2. **PoolItem & PoolRequest**:
   - `PoolItem`: Base deal/product listing for group buying.
   - `PoolRequest`: Specific active pool instance tracking host, target savings, participants list (status: pending, paid, disputed), payment proofs, and delivery updates.
3. **SkillListing & SkillConnection**:
   - `SkillListing`: Offered or requested skills with tags and category.
   - `SkillConnection`: Connection instances between learner and teacher tracking exchange status (`pending`, `accepted`, `completed`).
4. **Resource Schema**: Physical tools or items shared for borrowing, with daily cost/deposit and active rental request subdocuments.
5. **AssistancePost Schema**: Urgent community help posts (e.g., elderly aid, home repair) with urgency levels and volunteer responses.
6. **Event Schema**: Local community gatherings, workshops, or cleanups with date, location, organizer, and attendee lists.
7. **Message & Notification Schemas**: Real-time communication data models for standard user messaging and push notification records.

### 4.4 Engine & Business Logic Utilities

- **Trust Engine ([trustEngine.js](file:///Users/akshatsingh/Desktop/CommunityCollab/server/utils/trustEngine.js))**:
  - Computes a dynamic Trust Score (0-100) based on:
    - Profile completeness (+15 for phone, +5 for avatar, +5 for bio, +5 for verification)
    - Community point thresholds
    - Transaction history (completed pools, skill connections, resource loans)
    - Rating score and account age
    - Penalty deductions for open payment disputes (-15 per dispute)
  - Maps numerical score into Trust Levels: `new`, `low`, `moderate`, `good`, `trusted`, `verified_community_member`.

- **Badge Engine ([badgeEngine.js](file:///Users/akshatsingh/Desktop/CommunityCollab/server/utils/badgeEngine.js))**:
  - Evaluates rules for gamification badges (`First Step`, `Pool Master`, `Skill Guru`, `Super Volunteer`, `Community Pillar`).
  - Automatically awards badges, increments community points, creates notification entries, and emits live socket events.

- **WebSocket Layer ([socket.js](file:///Users/akshatsingh/Desktop/CommunityCollab/server/sockets/socket.js))**:
  - Manages active user socket mappings (`userSockets` Map).
  - Handles room joins (`join:room`) for real-time direct messaging (`chat:message`).
  - Provides utility `notifyUser` for instantaneous push notification delivery across the app.

---

## 5. Summary of Main Integration Flow

1. **User Authentication**: User logs in -> JWT token issued -> stored in `localStorage` -> attached to Axios authorization headers via interceptor.
2. **Real-time Synchronization**: Socket Provider connects socket using JWT auth -> joins personal user room -> receives real-time badge awards, group buy notifications, and direct chat messages.
3. **Group Buying Flow**: User creates/joins pool -> uploads receipt/proof image -> Host/Admin verifies proof -> Trust Engine recalculates trust scores -> Badge Engine awards community points.

## 6. Real-World Workflow Completion Updates

CommunityCollab now treats physical coordination as part of each transaction instead of leaving it to chat alone.

- **Location privacy**: public list and map responses expose approximate city-level coordinates. Exact pickup/meeting locations and instructions are returned only to users already participating in the transaction.
- **Group buying fulfilment**: pools support `common_pickup`, `individual_delivery`, and `digital` fulfilment methods. Common pickup stores pickup address, coordinates, landmark, instructions, and availability windows. Orderers can mark items ready for collection after order proof is submitted.
- **Carpool coordination**: carpools require origin, destination, coordinates, future departure time, and seat count. Riders can provide a pickup point and note when booking. Seat counts are validated server-side.
- **Resource handover**: approved borrow requests carry pickup/return instructions. Both owner and borrower confirm handover before the item is marked `in_possession`; borrower then marks return pending, and owner confirms final return before payment is allowed.
- **Skill sessions**: accepting a skill connection now requires an agreed session time, duration, session mode, and either meeting link or in-person location.
- **Assistance completion**: accepted help can move through matched -> in progress -> helper marked complete -> requester confirmed complete. Helper cancellation reopens rejected responses instead of dead-ending the post.
- **Messaging access control**: REST chat history, REST message sending, socket room joining, and socket message sending all validate room membership against the backing transaction or DM participants.

## 7. State Lifecycles

- **Pool**: `open -> ordering -> ordered -> completed`, with `cancelled` as a terminal branch. Participant collection: `pending -> ready -> collected`.
- **Carpool**: uses pool states for booking/payment, with server-side seat validation and rider pickup metadata.
- **Resource request**: `pending -> approved -> in_possession -> return_pending -> returned -> payment_confirmed` for paid resources; free resources end at `returned`.
- **Skill connection**: `pending -> accepted -> completed`, with `rejected` as terminal.
- **Assistance**: `open -> matched -> in_progress -> completed`, with cancellation reopening the post when the accepted helper cancels.
- **Event**: `published/ongoing -> completed/cancelled`, with joins blocked after start or when full.
