# Textile Consultancy Management System

A comprehensive ERP solution designed for tracking inventory, managing procurement workflows, and visualizing production analytics in the textile industry.

![Dashboard Preview](client/public/dashboard-preview.png)
*(Note: Screenshot placeholder)*

## 📚 Documentation
- **[Project Overview & Workflow](PROJECT_EXPLANATION.md)** - Start here to understand the logic.
- **[Backend Documentation](BACKEND_DOCS.md)** - API references and Database models.
- **[Frontend Documentation](FRONTEND_DOCS.md)** - UI structure and Component guide.

---

## 🚀 Key Features

### 🏭 Inventory & Production
*   **Real-time Stock Tracking:** Auto-deducts on issue, auto-adds on inward.
*   **Batch Tracking:** Monitor material usage per production batch.
*   **Dead Stock Detection:** Automatically flags materials unused for 60+ days.

### 📦 Procurement
*   **Digital Workflow:** `Raise PI` → `Approve` → `Inward Entry`.
*   **Supplier Management:** Track vendor performance and delays.
*   **Role-Based Access:** Strict separation of duties between Managers and Admins.

### 📊 Analytics & Reporting
*   **Inventory Health:** Visualize risk and critical stock levels.
*   **Cost Analysis:** Track monthly material expenditure.
*   **Efficiency Metrics:** Identify wastage and inefficiency in production.
*   **Inventory Health:** Visualize risk and critical stock levels.
*   **Cost Analysis:** Track monthly material expenditure.
*   **Efficiency Metrics:** Identify wastage and inefficiency in production.
*   **Forecasting:** Data-driven reorder suggestions.

### 👥 User Management & Admin
*   **User Control:** Admin-only user creation and deletion.
*   **Role-Based UI:** Distinct views for Supervisors, Store Managers, and Admins.

### 🎨 Design System
*   **Industrial Aesthetics:** Slate/Zinc color palette tailored for factory environments.
*   **Procurement Context:** Instant lookup of last supplier and purchase history.
*   **Smart Recommendations:** Auto-fill purchase requests based on stock levels.

---

## 🛠️ Tech Stack

### Frontend
- **React + Vite** (Fast, modern UI)
- **Tailwind CSS** (Responsive styling)
- **Recharts** (Data visualization)
- **Lucide React** (Icons)

### Backend
- **Node.js + Express** (Robust API)
- **MongoDB + Mongoose** (Flexible data storage)
- **TypeScript** (Type safety across the stack)
- **JWT Auth** (Secure access)

---

## ⚡ Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or cloud)

### Installation

1.  **Clone & Install**
    ```bash
    git clone <repo-url>
    cd consultancy-project
    
    # Server
    cd server
    npm install
    
    # Client
    cd ../client
    npm install
    ```

2.  **Environment Setup**
    Create `.env` files in both folders.
    *   **Server:** `PORT`, `MONGO_URI`, `JWT_SECRET`
    *   **Client:** `VITE_API_URL`

3.  **Run Locally**
    ```bash
    # Terminal 1: Server
    cd server
    npm run dev
    
    # Terminal 2: Client
    cd client
    npm run dev
    ```

4.  **Seed Data (Optional)**
    Populate the DB with 60 days of realistic demo data:
    ```bash
    cd server
    npx ts-node src/seed.ts
    ```

---

## 📄 License
MIT License.
