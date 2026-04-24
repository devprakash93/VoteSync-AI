# VoteSync AI — Government-Grade AI-Powered Digital Voting Infrastructure

**VoteSync AI** is a high-security, scalable, and transparent digital voting platform designed for enterprise and government-level elections. It combines real-world hierarchical governance with cutting-edge AI and cryptographic verification to ensure election integrity.

---

## ✨ Key Enhancements

### 1. 🏁 Post-Election Results Module
- **Immutable Snapshots:** Results are frozen into a `finalResultsSnapshot` upon election completion, preventing recalculation tampering.
- **Dedicated Results Page:** View winners, total votes, and turnout with interactive **Recharts** (Bar + Pie charts).
- **Public Transparency:** Results are publicly accessible once declared to ensure democratic accountability.

### 2. 🧾 Ballot Confirmation Slips
- **Official Receipts:** Every voter receives a printable "Ballot Confirmation Slip" styled after official ECI documents.
- **Cryptographic Tokens:** Includes a unique SHA-256 token to verify participation at `/verify`.
- **Secret Ballot Protection:** The slip intentionally excludes candidate choice to maintain voter privacy.

### 3. 👤 Voter Profile Dashboard
- **Personalized Data:** Voters can view their registered constituency, district, and assigned polling booth.
- **Participation History:** A complete, searchable history of elections the user has participated in.
- **Election Status:** Real-time visibility into Active, Upcoming, and Completed elections.

### 4. 🛡️ Privacy-Preserving Admin Registry
- **Turnout Tracking:** Admins can view a full registry of voters who have participated (Voter ID, Name, Timestamp).
- **Cryptographic Separation:** Uses a separate `VoterActivity` collection to ensure that identity and vote choice are never linked in the database.
- **Audit Logging:** Every admin access to participation data is recorded in an immutable audit log.

---

## 🏛️ System Architecture

- **Hierarchical Governance:** Country → State → District → Constituency → Polling Booth.
- **AI Intelligence Engine:** Predictive winner models, heuristic fraud detection, and participation insights.
- **Zero-Trust Security:** API rate limiting, device fingerprinting, and JWT-based role isolation.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Tailwind CSS, Framer Motion, Recharts, Lucide Icons.
- **Backend**: Node.js, Express, Socket.io (Real-time updates), Mongoose.
- **Security**: JWT, SHA-256 Hashing, Bcrypt, express-rate-limit.

---

## 🚦 Getting Started

### Installation

1.  **Clone the repository**
2.  **Setup Backend**:
    ```bash
    cd backend
    npm install
    # Create .env with: MONGO_URI, JWT_SECRET, PORT=5000
    npm run seed          # Initialize core infrastructure
    npm run demo-voters   # Populate with demo voter data
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
| **Chief Election Officer** | `admin@elections.gov.in` | `Admin@123` |
| **National Voter** | `voter.a.0@elections.demo` | `Voter@123` |

---

## 🤝 Contributing

We welcome contributions to **VoteSync AI**! To contribute:

1.  **Fork** the repository.
2.  **Create a Feature Branch** (`git checkout -b feature/AmazingFeature`).
3.  **Commit Your Changes** (`git commit -m 'Add some AmazingFeature'`).
4.  **Push to the Branch** (`git push origin feature/AmazingFeature`).
5.  **Open a Pull Request**.

Please ensure your code follows the existing style and includes proper documentation for new components.

---

**Developed for the next generation of transparent democracy.**

---

## 📜 License & Copyright

**© 2026 Dev Prakash (devprakash93). All Rights Reserved.**

This project is proprietary. No part of this repository may be copied, redistributed, or used for commercial purposes without explicit permission from the author.
