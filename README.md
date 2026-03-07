
# Golden Textile Dyers – ERP System

**Client:** Golden Textile Dyers, Erode  
**Type:** Full-stack Consultancy ERP  
**Stack:** React · TypeScript · Node.js · Express · MongoDB

> A role-based, real-time ERP built for a textile dyeing factory — covering inventory, procurement, production, HR, analytics, audit trails, and report generation.

---

## 📌 Overview

The system replaces manual operations with a structured, digital workflow covering the entire factory lifecycle:

- **Material procurement** from supplier to stock
- **Production batch management** from scheduling to completion
- **HR & workforce management** including compliance tracking
- **Analytics & decision support** with AI-driven reorder forecasting
- **Audit trail & reporting** with exportable PDF/CSV documents

---

## 👥 User Roles

| Role | Key Capabilities |
|---|---|
| **Admin** | PI approvals, full analytics, audit logs, reports, supplier management, user control |
| **Store Manager** | Inventory management, raise PI, inward entry, MRS issuance |
| **Supervisor** | Raise MRS, return material, schedule & execute production batches |
| **HR Manager** | Worker management, attendance, performance, shift & leave management |

---

## 🧩 Functional Modules

### 1. Inventory Management
- Real-time stock tracking with ABC categorisation
- Low stock and dead stock detection
- Material procurement context (last order, supplier, price)

### 2. Material Request System (MRS)
- Supervisors raise requests; store managers issue materials
- Pending & history views with PDF slip generation (company letterhead)
- Audit trail on every issue and return

### 3. Procurement & Inward
- Purchase Indent (PI) with admin approval workflow
- Inward entry auto-updates inventory
- Supplier performance scoring and delay tracking

### 4. Supplier Management
- Supplier master records and procurement history
- Performance analytics based on delivery reliability

### 5. Production Module
- Machine master (Hard/Soft flow, water recycling, generator mapping)
- Fabric lot management and batch scheduling
- Batch execution from start to completion with live monitor
- Yield analytics and re-issue efficiency metrics

### 6. HR Module
- Worker list with ESI/PF, migrant status, and skill matrix
- Attendance tracker, performance reviews, shift scheduling
- Leave management and worker-to-batch assignment

### 7. Analytics & Reports
- Inventory health (stock distribution, low stock, dead stock)
- AI-driven reorder forecast (30-day consumption + safety buffer)
- Production yield, cost trends, and inefficiency analysis
- Supplier performance and worker efficiency analytics

### 8. Audit Logs & Reports Module *(Admin only)*
- Complete audit trail for all critical system actions
- Built-in audit log browser with search, filters, date range, and pagination
- Colour-coded action badges by category (Auth, Inventory, Procurement, Production)
- Export audit logs as CSV
- Download / email system operations reports as PDF or CSV
- Automated daily report scheduling with configurable cron
- Report recipient management

---

## 📄 PDF Document System

All PDFs across the system share a **standardised company letterhead**:

```
GSTIN : 33AALFG7407L1Z6          0424 - 2534457
                                  Fax : 0424 - 2534458
            GOLDEN TEXTILE DYERS
          206 / 1, Gangapuram, ERODE – 638 102.
══════════════════════════════════════════════
```

**Features:** double page border · metadata info-card · colour-coded status rows · signature/authorization section · page-numbered footer

**Standardised filename format:** `GTD_{DocumentType}_{Identifier}_{Date}.pdf`

| Document | Example Filename |
|---|---|
| System Operations Report | `GTD_System-Operations-Report_2026-03-01_to_2026-03-07.pdf` |
| Material Request Slip | `GTD_Material-Request-Slip_MRS-ABC123_2026-03-07.pdf` |
| Product Inward Order | `GTD_Product-Inward-Order_PI-XYZ456_2026-03-07.pdf` |
| Reorder Forecast | `GTD_Reorder-Forecast_2026-03-07.pdf` |
| Audit Logs Export | `GTD_Audit-Logs_2026-03-07.csv` |

---

## 🛠️ Technology Stack

### Frontend
- React 18 + TypeScript (Vite)
- Vanilla CSS (Indigo Industrial design system)
- Recharts (analytics charts)
- jsPDF + jspdf-autotable (client-side PDF generation)
- React Query, React Router, React Hot Toast, Socket.io-client

### Backend
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- JWT authentication + Role-based middleware
- PDFKit (server-side PDF), json2csv (CSV export)
- Nodemailer (email reports), node-cron (scheduled reports)
- Socket.io (real-time notifications)

---

## 🔐 Security & Access Control

- JWT-based authentication with role-enforcement middleware
- All sensitive routes protected by `protect` + `authorize` middleware
- Admin-only access to Reports, Audit Logs, PI Approvals, User Management
- Passwords and tokens stripped from all audit log entries
- Immutable audit trail for all write operations

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or cloud)

### Installation

```bash
# Clone
git clone https://github.com/nitheesh1122/Consultancy_Project.git
cd Consultancy_Project

# Server
cd server
npm install

# Client
cd ../client
npm install
```

### Environment Variables

**`server/.env`**
```
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
EMAIL_USER=<smtp_email_address>
EMAIL_PASS=<smtp_password>
```

**`client/.env`**
```
VITE_API_URL=http://localhost:5000/api
```

### Running Locally

```bash
# Terminal 1 – Backend
cd server && npm run dev

# Terminal 2 – Frontend
cd client && npm run dev
```

---

## 📊 Phase Status

| Phase | Status | Description |
|---|---|---|
| 1 – Foundation | ✅ Complete | Inventory, MRS, procurement, auth |
| 2 – Analytics | ✅ Complete | Inventory health, procurement delays, cost trends |
| 3 – Intelligence | ✅ Complete | Reorder forecast, procurement context, brand UI |
| 4 – Production & HR | ✅ Complete | Batch management, live monitor, HR module |
| 5 – Audit & Reports | ✅ Complete | Full audit trail, reports dashboard, PDF letterhead system |

---

## 📄 License

MIT License

---

👤 **Project Ownership**  
Created by: **Nitheesh S**  
GitHub: [nitheesh1122](https://github.com/nitheesh1122)
