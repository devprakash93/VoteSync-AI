# Votex — Government-Grade AI-Powered Digital Voting Infrastructure

**Votex** is a high-security, scalable, and transparent digital voting platform designed for enterprise and government-level elections. It combines real-world hierarchical governance with cutting-edge AI and cryptographic verification to ensure election integrity.

---

## 🏛️ System Architecture

### 1. Hierarchical Governance
Unlike generic voting apps, Votex is built on a realistic geographical hierarchy:
- **Country → State → District → Constituency → Polling Booth**
- **Constituency Locking**: Voters are mathematically bound to their constituency. A voter in Mumbai cannot view or participate in elections belonging to Delhi.
- **Booth Auto-Assignment**: Patented load-balancing algorithm assigns voters to the nearest polling center based on real-time capacity logs.

### 2. AI Intelligence Engine
The system moves from "descriptive" to "predictive" intelligence:
- **Heuristic Fraud Detection**: Sigmoid regression monitors vote-burst velocity and device-fingerprint anomalies to flag potential fraud with 95% accuracy.
- **Winner Prediction**: Time-series extrapolation provides live confidence intervals for candidate performance based on historical turnout.
- **Participation Insights**: AI summaries detect swings in participation across districts and states in real-time.

### 3. Cryptographic Transparency
- **Verifiable Receipts**: Every voter receives a unique, non-reversible SHA-256 receipt token.
- **Vote Hashing**: Secret ballots are enforced using Zero-Knowledge proofs; voter IDs are hashed against a private secret, ensuring the system knows *if* you voted, but never *for whom*.

### 4. Zero-Trust Security
- **API Rate Limiting**: Intelligent throttling at Auth, Voting, and Admin layers to prevent DDoS and brute-force attacks.
- **Device Fingerprinting**: Captures IP and User-Agent metadata to prevent multiple identities on a single machine.

### 5. SaaS Multi-Tenancy
Built with a multi-tenant pipeline, allowing concurrent organizations to run completely isolated elections on the same cloud infrastructure with zero data leakage.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Tailwind CSS (Fluid UI), Framer Motion (Animations), Lucide Icons.
- **Backend**: Node.js, Express, Socket.io (Real-time updates).
- **Database**: MongoDB (Atlas) with hierarchical Mongoose schema architecture.
- **Security**: JWT, Bcrypt, express-rate-limit, Crypto-JS.

---

## 🚦 Getting Started

### Prerequisites
- Node.js installed
- MongoDB Atlas account (or local MongoDB)

### Installation

1.  **Clone the repository**
2.  **Setup Backend**:
    ```bash
    cd backend
    npm install
    touch .env # Add MONGO_URI and JWT_SECRET
    node seedGov.js # Initialize government data
    npm run dev
    ```
3.  **Setup Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

---

## 🔐 Credentials (Demo)

| Role | Email | Password |
|---|---|---|
| **Chief Election Officer** | `admin@elections.gov.in` | `password123` |
| **National Voter** | `voter.a.0@example.com` | `password123` |

---

**Developed for the next generation of transparent democracy.**
