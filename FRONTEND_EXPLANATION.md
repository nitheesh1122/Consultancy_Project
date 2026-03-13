# Frontend — File-by-File Explanation

> **Stack**: React 19 + TypeScript, Vite 7, Tailwind CSS, React Router v7, TanStack React Query, Recharts, Framer Motion, Lucide Icons, jsPDF

---

## Root Files

| File | What It Does |
|------|-------------|
| `src/main.tsx` | App entry point. Wraps `<App />` in React StrictMode and TanStack React Query `QueryClientProvider` (5-min stale time). |
| `src/App.tsx` | Root router. Defines 3 route guards (`ProtectedRoute`, `CustomerRoute`, `SupplierRoute`). Configures all routes, wraps everything in `AuthProvider`, `SocketProvider`, and `react-hot-toast` Toaster. |
| `src/index.css` | Global Tailwind stylesheet with CSS custom properties (design tokens). Loads Source Sans 3 + JetBrains Mono fonts. Defines the warm neutral + muted teal color palette. |
| `src/App.css` | Minimal CSS — sets `#root` to full viewport height/width. |

---

## Context Providers (`context/`)

| File | What It Does |
|------|-------------|
| `AuthContext.tsx` | Auth state management via React Context. Stores user (id, username, role, token) in `sessionStorage`. Exposes `login()`, `logout()`, and `user` object. Handles all 7 roles. |
| `SocketContext.tsx` | WebSocket provider. Creates a `socket.io-client` connection to `localhost:3000`. Exposes `socket` instance and `isConnected` boolean via context. Used for real-time notifications and live production monitoring. |

---

## Hooks (`hooks/`)

| File | What It Does |
|------|-------------|
| `useAuth.ts` | Convenience hook that reads `AuthContext`. Throws error if used outside `AuthProvider`. Returns `{ user, login, logout }`. |
| `useProduction.ts` | React Query hooks for the production module: `useCreateBatch` (mutation), `useBatchUpdates` (socket-driven real-time batch status updates). |

---

## Layouts (`layouts/`)

| File | What It Does |
|------|-------------|
| `DashboardLayout.tsx` | Internal staff layout. Renders collapsible `Sidebar`, top header bar with search input + `NotificationBell`, loading screen transition, and `<Outlet />` for nested routes. Used by all internal (non-customer/supplier) routes. |
| `CustomerLayout.tsx` | Customer portal layout. Teal-themed sidebar with "My Orders" and "Place Order" navigation. Shows customer name and logout button. Wraps `/customer/*` routes. |
| `SupplierLayout.tsx` | Supplier portal layout. Emerald-themed sidebar with Dashboard, RFQs, and Purchase Orders navigation. Shows supplier name and logout button. Wraps `/supplier/*` routes. |

---

## Pages — Internal Top Level (`pages/`)

| File | Route | Roles | What It Does |
|------|-------|-------|-------------|
| `Login.tsx` | `/login` | All internal | Staff login page. Posts to `/api/auth/login`, stores JWT in sessionStorage, redirects to `/`. |
| `Home.tsx` | `/` | ADMIN, MANAGER, STORE_MANAGER, SUPERVISOR, HR_MANAGER | Role-aware dashboard. ADMIN/MANAGER see analytics KPIs + inventory health charts + recent MRS. SUPERVISOR sees their recent material requests. HR_MANAGER sees the HRDashboard component. |
| `Inventory.tsx` | `/inventory` | ADMIN, MANAGER, STORE_MANAGER | Full material inventory table with search/filter. Shows ABC category badges, stock-level alerts, and procurement context modal on row click. |
| `MaterialDetails.tsx` | `/inventory/:id` | ADMIN, MANAGER, STORE_MANAGER | Single material detail view with full transaction history (all issues, inwards, adjustments, returns). |
| `RequestMaterial.tsx` | `/request-material` | SUPERVISOR | Create new Material Requisition Slips (MRS). Select batch ID, add material items with quantities. Shows request history with timeline visualization. |
| `MRSList.tsx` | `/mrs-list` | STORE_MANAGER, MANAGER | View and manage all MRS requests. Tabs for Pending/History. Store Manager can issue materials (full or partial). Includes PDF download for MRS documents. |
| `RaisePI.tsx` | `/raise-pi` | STORE_MANAGER | Create Product Inward (purchase) orders. AI-suggested smart ordering feature. Shows PI history with decision explanation cards. |
| `PIApprovals.tsx` | `/pi-approvals` | MANAGER | Approve or reject PI orders raised by Store Managers. Shows supplier info, item details, and approval controls with remarks. |
| `InwardEntry.tsx` | `/inward-entry` | STORE_MANAGER | Record inward receipt of materials against approved PIs. Tabs for Pending/Completed entries. PDF download support. |
| `ReturnMaterial.tsx` | `/return-material` | SUPERVISOR | Return unused materials back to store. Select material, specify quantity and reason. |
| `Suppliers.tsx` | `/suppliers` | ADMIN, MANAGER | Supplier master list with links to individual supplier detail pages. |
| `SupplierDetails.tsx` | `/suppliers/:id` | ADMIN, MANAGER | Per-supplier analytics: KPI cards (delivery times, quality scores), line charts, performance history table. |
| `CustomerOrders.tsx` | `/customer-orders` | MANAGER | Internal management of all customer orders. Approve/reject orders with remarks. Expandable rows showing order pipeline visualization. Filter by status tabs. |
| `Procurement.tsx` | `/procurement` | MANAGER, STORE_MANAGER | Unified RFQ + PO procurement hub. Create RFQs (select materials + suppliers + due date), view submitted quotations, compare and accept quotations (auto-creates PO). Tabbed view: RFQs tab and POs tab. |
| `DispatchPage.tsx` | `/dispatch` | STORE_MANAGER, MANAGER | Create and manage dispatches for completed customer orders. Summary cards (dispatched/in-transit/delivered counts). Dispatch table with status transition buttons. Create dispatch modal (select order, enter vehicle/driver/invoice details). |
| `Notifications.tsx` | `/notifications` | All authenticated | Full notification list with mark-as-read functionality. |
| `ReportsModule.tsx` | `/reports` | ADMIN, MANAGER | Multi-tab reports hub: generate reports, manage email recipients, send reports via email, configure report settings, view audit logs with CSV export. |
| `UserManagement.tsx` | `/settings/users` | ADMIN | User CRUD. Create new users with role assignment, view user list, delete users. |
| `Placeholders.tsx` | N/A | — | Barrel file that re-exports actual page components as named exports for route imports. |

---

## Pages — Customer Portal (`pages/customer/`)

| File | Route | What It Does |
|------|-------|-------------|
| `CustomerLogin.tsx` | `/customer/login` | Customer-specific login page. Teal branding. Validates that the logged-in user has CUSTOMER role, redirects to `/customer/dashboard`. |
| `CustomerDashboard.tsx` | `/customer/dashboard` | Customer's order overview. Shows order count by status, recent orders table with status badges, and link to create new orders. |
| `CreateOrder.tsx` | `/customer/create-order` | Order placement form: fabric type, GSM, color, shade code, quantity (KG), delivery date, price per KG, special instructions. Auto-calculates total value. |
| `OrderTracking.tsx` | `/customer/order/:id` | Detailed single-order view. Uses shared `OrderPipeline` component for 7-stage visual pipeline tracker (Placed → Approved → Fabric Received → In Production → Completed → Dispatched → Delivered). Shows order details and pricing. |

---

## Pages — Supplier Portal (`pages/supplier/`)

| File | Route | What It Does |
|------|-------|-------------|
| `SupplierLogin.tsx` | `/supplier/login` | Supplier-specific login page. Emerald/green branding. Validates SUPPLIER role, redirects to `/supplier/dashboard`. |
| `SupplierDashboard.tsx` | `/supplier/dashboard` | Supplier overview: Open RFQ count, Active POs, Awaiting Shipment, In Transit counters. Lists recent RFQs and POs. |
| `RFQList.tsx` | `/supplier/rfq` | Table of RFQs assigned to the logged-in supplier. Shows RFQ number, items, due date, status. Link to submit quotation. |
| `SubmitQuotation.tsx` | `/supplier/rfq/:rfqId` | Quotation submission form. Shows RFQ details, per-item unit price entry, delivery days, payment terms, remarks. Live total calculation. |
| `SupplierPurchaseOrders.tsx` | `/supplier/purchase-orders` | View and manage Purchase Orders. Confirm PO acknowledgment. Create shipment modal (vehicle number, driver details, expected delivery date). |

---

## Pages — Analytics Module (`pages/analytics/`)

| File | Route | What It Does |
|------|-------|-------------|
| `AnalyticsLayout.tsx` | `/analytics` | Tab-based layout: Inventory / Production / Workers / Suppliers tabs. Auto-redirects to `/analytics/inventory`. |
| `AnalyticsInventory.tsx` | `/analytics/inventory` | Inventory health metrics, ABC analysis breakdown, demand forecasting charts (Recharts), decision explanation cards, PDF export. |
| `AnalyticsProduction.tsx` | `/analytics/production` | Production analytics with date range filter. Batch completion stats, efficiency metrics, bar/line charts for yield trends. |
| `AnalyticsWorkers.tsx` | `/analytics/workers` | Worker performance and efficiency tables. Shows yield, attendance, and efficiency rankings. |
| `AnalyticsSuppliers.tsx` | `/analytics/suppliers` | Supplier quality scores, procurement performance metrics (avg approval time, delayed PIs), decision explanation cards. |

---

## Pages — HR Module (`pages/hr/`)

| File | Route | What It Does |
|------|-------|-------------|
| `HrLayout.tsx` | `/hr` | Tab layout for HR sub-pages: Worker Directory / Attendance / Shift Management / Leave Requests / Worker Assignment / Performance. Auto-redirects to `/hr/workers`. |
| `HRWorkerList.tsx` | `/hr/workers` | Worker directory with CRUD. Shows worker ID, name, role, phone, status. Add/edit/delete workers. Uses `ReadOnlyTable` component. |
| `AttendanceTracker.tsx` | `/hr/attendance` | Daily attendance marking. Select date + shift, see all workers, bulk mark status (Present/Absent/Half-Day/Late/On Leave) with per-worker remarks. Color-coded status buttons. Summary counts at the top. |
| `ShiftManagement.tsx` | `/hr/shifts` | Create and manage shifts (Morning/Evening/Night). Color-coded shift cards (amber/blue/indigo). Create shift modal with pre-filled timings. Assign workers modal with checkbox grid and capacity enforcement. |
| `LeaveRequests.tsx` | `/hr/leaves` | Leave request management. Summary cards (pending/approved/rejected). Status filter pills. Create leave request modal. Approve/reject actions with rejection reason modal. |
| `WorkerAssignment.tsx` | `/hr/assignments` | Assignment board. Shows available/busy/on-leave worker counts. Active production batches with assigned workers. Available workers table with machine type skills. |
| `HRPerformance.tsx` | `/hr/performance` | Performance dashboard. KPI cards (avg yield, avg attendance, total workers, safety incidents). Recharts BarChart for top workers by yield. PieChart for role distribution. Low-attendance workers alert table. Full performance data table. |

---

## Pages — Production Module (`pages/production/`)

| File | Route | What It Does |
|------|-------|-------------|
| `MachineMaster.tsx` | `/production/machines` | Machine registry CRUD. 6 machine types (Winch, Soft Flow, Jet Dyeing, Jigger, HT-HP, Beam Dyeing). Detailed specs (capacity, temperature, liquor ratio), financial data, infrastructure. Uses `ReadOnlyTable`. |
| `FabricLotList.tsx` | `/production/lots` | Fabric lot listing with status tracking (Pending/In Production/Completed). Add/edit/delete lots via `FabricLotForm`. |
| `FabricLotForm.tsx` | N/A (modal form) | Reusable form for creating/editing fabric lots: lot number, supplier, fabric type, GSM, rolls, weight, date. |
| `ScheduleBatch.tsx` | `/production/schedule` | Schedule new production batches. Select machine, date, shift, and lot. Enter fabric details (type, GSM, input weight, shade target). |
| `MyBatches.tsx` | `/production/my-batches` | Supervisor's active/scheduled batch list. Click through to execute individual batches. |
| `BatchExecution.tsx` | `/production/batch/:id/execute` | Start and complete batch execution. Assign workers, start batch, then record completion data (output weight, first grade, defects). Real-time polling for updates. |
| `LiveMonitor.tsx` | `/production/monitor` | Real-time production floor dashboard. Shows active batch per machine, idle machines. Socket-enabled live updates + 30-second polling fallback. Filter by All/Active/Idle. |
| `ReportConfig.tsx` | `/production/settings` | System settings page: target yield percentage, utility rates (water/steam/electricity), daily report email recipient list. |

---

## Pages — Settings (`pages/settings/`)

| File | Route | What It Does |
|------|-------|-------------|
| `SettingsLayout.tsx` | `/settings` | Tab layout: User Management / Report Configuration. Admin-only. Auto-redirects to `/settings/users`. |

---

## Components — Domain (`components/`)

| File | What It Does |
|------|-------------|
| `Sidebar.tsx` | Main navigation sidebar. Role-based menu sections: Operations, Materials, Procurement, Customer Orders, Production Module, System Admin. Collapsible with icons. |
| `Charts.tsx` | Reusable Recharts wrappers: `SimpleBarChart` and `SimpleLineChart` with gradient fills and themed styling. |
| `HRDashboard.tsx` | HR dashboard widget shown on Home page for HR_MANAGER. Displays workforce KPIs (total workers, attendance rate, active shifts, pending leaves). |
| `KPICard.tsx` | Styled KPI display card with icon, formatted value, trend direction indicator (up/down arrow), and status-colored bottom border. |
| `NotificationBell.tsx` | Header notification icon with unread count badge. Listens for real-time socket `notification` events to auto-refresh. Links to `/notifications`. |
| `OrderPipeline.tsx` | Visual pipeline/stepper component with progress bar. Exports `ORDER_STAGES` (7-step order lifecycle) and `BATCH_STAGES` (3-step batch lifecycle). Supports compact mode. Used by CustomerOrders and OrderTracking. |
| `PDFDownloadButton.tsx` | Download button that generates branded PDF documents for MRS or PI records using the `pdfGenerator` library. |
| `Pipeline.tsx` | Procurement pipeline stepper: Requested → Issued → Raised → Approved → Completed. Responsive horizontal/vertical layout. |
| `RequestTimeline.tsx` | Visual timeline for MRS request status: Pending → Approved → Issued (or Rejected branch). |
| `Unauthorized.tsx` | Full-page "Access Denied" message with link back to dashboard. |

---

## Components — Modals (`components/modals/`)

| File | What It Does |
|------|-------------|
| `ProcurementContextModal.tsx` | Animated modal showing procurement context for a material: order history, last inward details, supplier info. Uses Framer Motion for enter/exit animations. |

---

## Components — UI Primitives (`components/ui/`)

| File | What It Does |
|------|-------------|
| `Button.tsx` | Themed button with 5 variants (primary, secondary, outline, ghost, danger), 3 sizes (sm, md, lg), and loading state with spinner. |
| `Input.tsx` | Styled text input with focus ring, optional monospace mode. Forwards ref. |
| `Select.tsx` | Styled `<select>` dropdown matching the Input design. Forwards ref. |
| `Modal.tsx` | Generic modal overlay. Props: `isOpen`, `onClose`, `title`, `children`, `className`. Body scroll lock, backdrop click to close. Named export: `{ Modal }`. |
| `Table.tsx` | Composable table primitives: `Table`, `TableHeader`, `TableHead`, `TableBody`, `TableRow`, `TableCell`. |
| `ReadOnlyTable.tsx` | Generic data table with typed column definitions, loading skeleton, empty state, and "View Only" badge. Used by MachineMaster and HRWorkerList. |
| `StatusBadge.tsx` | Colored inline badge. Variants: info (blue), success (green), warning (amber), critical (red), neutral (gray). |
| `MetricCard.tsx` | Dashboard metric card with title, value, optional trend arrow, icon, and status-colored indicator bar. |
| `DecisionExplanation.tsx` | AI/system decision explanation card showing status level (critical/warning/good/info), reasons list, recommended action, and business impact. |
| `EmptyState.tsx` | Placeholder for empty data: icon, title, description, optional action button. |
| `LoadingScreen.tsx` | Full-screen branded loading overlay with animated spinner and "Golden Textile Dyers" branding text. |
| `Skeleton.tsx` | Animated skeleton shimmer placeholder for loading states. |

---

## Lib (`lib/`)

| File | What It Does |
|------|-------------|
| `api.ts` | Axios instance configured for `VITE_API_URL` (defaults to `localhost:3000/api`). Request interceptor auto-attaches Bearer JWT token from sessionStorage. |
| `pdfGenerator.ts` | PDF generation using jsPDF + jspdf-autotable. Branded letterhead for "Golden Textile Dyers" with company address, GSTIN, and color palette matching physical stationery. |
| `utils.ts` | `cn()` utility — combines `clsx` + `tailwind-merge` for conditional Tailwind class name composition. |

---

## Utils (`utils/`)

| File | What It Does |
|------|-------------|
| `apiRetry.ts` | `withRetry()` helper — retries failed API calls once on HTTP 409 (conflict) errors. Used by production hooks for optimistic updates. |

---

## File Count Summary

| Category | Count |
|----------|-------|
| Pages (all modules) | 38 |
| Components (domain + modal + UI) | 22 |
| Layouts | 3 |
| Hooks | 2 |
| Context Providers | 2 |
| Lib Utilities | 3 |
| Utils | 1 |
| Root Files (App.tsx, main.tsx) | 2 |
| CSS Files | 2 |
| **Total** | **75** |
