# Backend — File-by-File Explanation

> **Stack**: Node.js, Express 5, TypeScript, Mongoose (MongoDB), JWT, Socket.IO, Nodemailer, PDFKit, node-cron

---

## Core Files

| File | What It Does |
|------|-------------|
| `src/index.ts` | Express app entry point. Configures CORS, JSON body parsing, mounts all 22 route modules under `/api/*`, creates HTTP server, initializes Socket.IO, and starts cron jobs. Listens on `PORT` env var (default 3000). |
| `src/db.ts` | MongoDB connection. Connects to `MONGO_URI` env variable or defaults to `mongodb://127.0.0.1:27017/consultancy_db`. Logs connection success/failure. |
| `src/socket.ts` | Socket.IO initialization. Exports `initSocket(server)` and `getIO()`. Handles room-based joining via `join_role` event — users join rooms named after their role (e.g., `MANAGER`, `HR_MANAGER`) or their user ID for personal notifications. |

---

## Middleware (`middleware/`)

| File | What It Does |
|------|-------------|
| `authMiddleware.ts` | **4 exported functions**: `protect()` — verifies JWT Bearer token from Authorization header, attaches `req.user` (id, role). `authorize(...roles)` — checks if `req.user.role` is in the allowed list. `requireManager()` — blocks ADMIN from performing write operations. `internalOnly()` — blocks CUSTOMER and SUPPLIER roles from accessing internal-only routes. |
| `auditMiddleware.ts` | **2 exported functions**: `logAudit(action)` — Express middleware that creates an AuditLog document with the action name, user info, request body (sanitized — removes passwords), and IP address. `manualLog(action, userId, details)` — programmatic audit logging for use inside controllers. |

---

## Models (`models/`) — 25 Files

### Authentication & System

| File | Key Fields | What It Does |
|------|------------|-------------|
| `User.ts` | `username` (unique), `password` (bcrypt hashed), `role` (enum: ADMIN, MANAGER, STORE_MANAGER, SUPERVISOR, HR_MANAGER, CUSTOMER, SUPPLIER), `profileId` (ObjectId — links to Customer/Supplier profile), `createdBy` (ObjectId → User) | User accounts for all 7 roles. |
| `Notification.ts` | `recipient` (ObjectId → User), `message`, `type` (INFO/SUCCESS/WARNING/ERROR), `read` (boolean), `link` (optional URL) | In-app notifications. |
| `AuditLog.ts` | `action`, `userId` (ObjectId → User), `details` (mixed object), `ipAddress`, `timestamp` | System audit trail for compliance and tracking. |
| `Settings.ts` | `utilityRates` { waterPerLiter, steamPerKg, electricityPerKwh }, `updatedBy` (ObjectId → User) | System-wide utility rates used in production cost calculations. |
| `ReportConfig.ts` | `isDailyReportEnabled`, `dailyReportSchedule` (cron string), `lastReportSentAt` | Configuration for automated daily report generation. |
| `ReportRecipient.ts` | `email`, `name`, `isActive` | Email addresses that receive automated daily reports. |

### Inventory & Materials

| File | Key Fields | What It Does |
|------|------------|-------------|
| `Material.ts` | `name`, `code`, `category` (DYE/CHEMICAL), `unit`, `quantity`, `minStock`, `unitCost`, `abcCategory` (A/B/C/None), `supplierId` | Master inventory of dyes and chemicals with stock tracking and ABC categorization. |
| `MRS.ts` | `batchId`, `supervisorId`, `items[]` { materialId, quantityRequested, quantityIssued }, `status` (PENDING/ISSUED/REJECTED/PARTIALLY_ISSUED) | Material Requisition Slips — supervisor requests for production materials. |
| `ProductInward.ts` | `storeManagerId`, `supplierId`, `adminId`, `items[]` { materialId, quantity, unitPrice }, `status` (RAISED/APPROVED/REJECTED/COMPLETED), `approvalRemarks` | Purchase Inward orders for restocking materials from suppliers. |
| `Transaction.ts` | `type` (ISSUE/INWARD/ADJUSTMENT/RETURN), `materialId`, `quantity`, `relatedId`, `performedBy`, `timestamp` | Inventory movement ledger — every single stock change is recorded here. |

### Production

| File | Key Fields | What It Does |
|------|------------|-------------|
| `Machine.ts` | `machineId` (auto: MCH-001), `name`, `type` (WINCH/SOFT_FLOW/JET_DYEING/JIGGER/HT_HP/BEAM_DYEING), `capacityKg`, `specifications` { maxTemp, liquorRatio, heatingSource, cooling, drainageType, pumpPressure }, `operation` { minLoadKg, avgCycleTime, waterConsumption, steamConsumption, powerConsumption }, `financial` { purchaseCost, installationDate, depreciationRate }, `infrastructure` { location, powerConnection, steamConnection, waterConnection, drainConnection } | Dyeing machine registry with full technical, operational, financial, and infrastructure specs. |
| `Worker.ts` | `workerId` (auto: WKR-001), `name`, `phone`, `role` (HELPER/OPERATOR/SENIOR_OPERATOR/SUPERVISOR/TECHNICIAN/LAB_ASSISTANT), `status` (ACTIVE/BUSY/ON_LEAVE/INACTIVE), `personal` { dateOfBirth, gender, address, emergencyContact }, `employment` { joiningDate, experienceYears, bankAccount, esiNumber, pfNumber }, `skills` { machineTypes, fabricSpecialization, shadeMatching, chemicalHandling }, `performance` { monthlyYieldAvg, attendanceRate, batchesCompleted } | Factory worker profiles with personal, employment, skill, and performance data. |
| `ProductionBatch.ts` | `batchNumber`, `supervisorId`, `machineId`, `scheduledDate`, `shift`, `lotNumber`, `fabricType`, `gsm`, `inputKg`, `shadeTarget`, `mrsId`, `assignedWorkers[]`, `status` (SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED), `outputFirstGradeKg`, `yieldPercentage`, `quality` { shadeMatch, fabricHand, colorfastness }, `wastage` { type, percentage } | Production batch lifecycle with quality metrics, yield calculations, and worker assignments. |
| `FabricLot.ts` | `lotNumber`, `supplierParty`, `fabricType`, `gsm`, `totalRolls`, `totalWeightKg`, `receivedDate`, `status` (PENDING/IN_PRODUCTION/COMPLETED), `supervisorId` | Incoming fabric lots before production begins. |

### Supplier & Procurement

| File | Key Fields | What It Does |
|------|------------|-------------|
| `Supplier.ts` | `name`, `contactPerson`, `phone`, `materialCategories[]`, `rating`, `ratingCount`, `isActive` | Supplier master data. |
| `RFQ.ts` | `rfqNumber`, `items[]` { materialId, quantity, unit }, `sentToSuppliers[]`, `createdBy`, `status` (OPEN/QUOTATIONS_RECEIVED/CLOSED/PO_CREATED), `dueDate` | Request for Quotation — sent to multiple suppliers for competitive pricing. |
| `Quotation.ts` | `rfqId`, `supplierId`, `items[]` { materialId, unitPrice, quantity }, `totalPrice`, `deliveryDays`, `paymentTerms`, `status` (SUBMITTED/ACCEPTED/REJECTED) | Supplier quotations submitted in response to RFQs. |
| `PurchaseOrder.ts` | `poNumber`, `rfqId`, `quotationId`, `supplierId`, `items[]` { materialId, quantity, unitPrice }, `totalAmount`, `status` (ISSUED/CONFIRMED/SHIPPED/DELIVERED/CANCELLED), `expectedDelivery` | Purchase orders issued to suppliers (auto-created when quotation is accepted). |
| `Shipment.ts` | `purchaseOrderId`, `supplierId`, `dispatchDate`, `vehicleNumber`, `driverName`, `expectedDelivery`, `actualDelivery`, `status` (IN_TRANSIT/DELIVERED/DELAYED) | Inbound supplier shipments against purchase orders. |

### Customer & Dispatch

| File | Key Fields | What It Does |
|------|------------|-------------|
| `Customer.ts` | `name`, `companyName`, `contact`, `email`, `address`, `userId` (→ User), `createdBy`, `isActive` | Customer master data, linked to User accounts for portal login. |
| `CustomerOrder.ts` | `orderNumber`, `customerId`, `fabricType`, `fabricGSM`, `color`, `shadeCode`, `quantity` (KG), `deliveryDate`, `pricePerKg`, `totalValue`, `status` (PLACED → APPROVED → FABRIC_RECEIVED → IN_PRODUCTION → COMPLETED → DISPATCHED → DELIVERED), `productionBatchId`, `dispatchId`, `approvedBy` | Customer dyeing orders with 7-stage lifecycle tracking. |
| `Dispatch.ts` | `dispatchNumber`, `customerOrderId`, `customerId`, `items[]` { description, quantity, unit }, `totalWeight`, `vehicleNumber`, `driverName`, `driverPhone`, `dispatchDate`, `expectedDelivery`, `invoiceNumber`, `invoiceAmount`, `status` (PACKED/DISPATCHED/IN_TRANSIT/DELIVERED/RETURNED), `dispatchedBy` | Outbound shipment records. Auto-updates customer order to DELIVERED when dispatch is delivered. |

### HR & Workforce

| File | Key Fields | What It Does |
|------|------------|-------------|
| `Attendance.ts` | `workerId`, `date`, `clockIn`, `clockOut`, `shift` (MORNING/EVENING/NIGHT), `status` (PRESENT/ABSENT/HALF_DAY/LATE/ON_LEAVE), `overtimeHours`, `markedBy`. **Unique index**: { workerId, date } | Daily worker attendance records. One record per worker per day. |
| `LeaveRequest.ts` | `workerId`, `leaveType` (CASUAL/SICK/EARNED/EMERGENCY/UNPAID), `startDate`, `endDate`, `days`, `reason`, `status` (PENDING/APPROVED/REJECTED/CANCELLED), `approvedBy`, `rejectionReason` | Worker leave applications with approval workflow. |
| `Shift.ts` | `name` (MORNING/EVENING/NIGHT), `startTime`, `endTime`, `date`, `workers[]`, `capacity`, `supervisor`, `createdBy`. **Unique index**: { name, date } | Shift scheduling. One shift per type per day. |

---

## Controllers (`controllers/`) — 22 Files

### Authentication & System

| File | Functions | What It Does |
|------|-----------|-------------|
| `authController.ts` | `registerUser`, `loginUser`, `getUsers`, `deleteUser` | User registration (bcrypt hash, role assignment, optional profileId linking), JWT login (returns token + user info), user listing (excludes passwords), user deletion. |
| `notificationController.ts` | `sendNotification`, `getNotifications`, `markAsRead`, `markAllRead` | Create notification + emit socket event, fetch user's notifications, mark individual/all as read. |
| `settingsController.ts` | `getSettings`, `updateUtilityRates` | Get system settings (utility rates), update utility rates (water/steam/electricity per unit). |
| `auditController.ts` | `getAuditLogs`, `exportAuditLogsCSV` | Retrieve audit logs with filtering (by action type, user, date range). Export filtered logs as CSV download. |

### Inventory & Materials

| File | Functions | What It Does |
|------|-----------|-------------|
| `materialController.ts` | `getMaterials`, `getProcurementContext`, `calculateABC` | List all materials with search. Get procurement context for a material (open PIs, recent transactions, supplier info). Calculate ABC categorization across all materials based on value/usage. |
| `mrsController.ts` | `createMRS`, `getMyMRS`, `getPendingMRS`, `getMRSHistory`, `issueMRS`, `returnMaterial` | Create MRS (supervisor → material request). Get supervisor's own MRS. Get pending MRS for store manager. Issue materials (deduct stock, create transactions, notify supervisor). Process material returns (increment stock). |
| `piController.ts` | `createPI`, `getPIs`, `updatePIStatus`, `processInward` | Raise purchase inward order (store manager). List PIs with filters. Approve/reject PI (manager). Process inward receipt (increment stock, create transactions, mark PI complete). |
| `transactionController.ts` | `getMaterialHistory` | Get all transactions for a specific material (issues, inwards, adjustments, returns). |

### Production

| File | Functions | What It Does |
|------|-----------|-------------|
| `productionBatchController.ts` | `createBatch`, `startBatch`, `completeBatch`, `getBatchById`, `getBatches`, `getMonitorView` | Schedule batch (generate batch number, link to machine/lot). Start batch (set status, assign workers, update machine status, emit socket event). Complete batch (record output weight, calculate yield/quality/wastage, update worker performance stats). Monitor view (aggregate active batches by machine for live dashboard). |
| `productionAnalyticsController.ts` | `getProductionDashboard` | Aggregate production KPIs: total batches, avg yield, machine utilization rates, yield trends over time. |
| `machineController.ts` | `getMachines`, `createMachine`, `updateMachine`, `deleteMachine` | Machine CRUD. Auto-generates machineId (MCH-001 format). Full specs management. |
| `workerController.ts` | `getWorkers`, `createWorker`, `updateWorker`, `deleteWorker`, `getAvailableWorkers` | Worker CRUD. Auto-generates workerId (WKR-001 format). `getAvailableWorkers` filters workers with ACTIVE status for assignment. |
| `fabricLotController.ts` | `getLots`, `createLot`, `updateLot`, `deleteLot` | Fabric lot CRUD. Track incoming raw fabric before production. |

### Analytics

| File | Functions | What It Does |
|------|-----------|-------------|
| `analyticsController.ts` | `getDashboardStats`, `getInventoryHealth`, `getProcurementPerformance`, `getEfficiencyStats`, `getCostAnalytics`, `getForecast`, `getWorkerPerformance`, `getWorkerEfficiency`, `getSupplierQuality`, `getHRDashboardStats` | Comprehensive analytics engine: dashboard KPIs (stock value, low stock count, pending MRS/PI, pending orders), inventory health (category breakdown, stock-level alerts), procurement metrics (avg approval time, completion time, delayed PIs), efficiency stats, cost analysis, demand forecasting, worker performance/efficiency rankings, supplier quality scores, HR dashboard stats (workforce counts, attendance rates, shift/leave stats). |

### Customer & Dispatch

| File | Functions | What It Does |
|------|-----------|-------------|
| `customerOrderController.ts` | `createCustomer`, `getCustomers`, `createOrder`, `getMyOrders`, `getOrderById`, `getAllOrders`, `approveOrder`, `updateOrderStatus` | Create customer (+ creates linked User account with CUSTOMER role and hashed password). List customers. Place order (customer creates dyeing order with auto-generated order number). Get own orders (customer). Get single order. Get all orders (manager view). Approve/reject order (manager — with remarks and notifications). Update order status (with stage validation and socket notifications). |
| `supplierPortalController.ts` | `createSupplierAccount`, `createRFQ`, `getRFQs`, `getSupplierRFQs`, `submitQuotation`, `getQuotationsForRFQ`, `acceptQuotation`, `getSupplierPOs`, `getAllPOs`, `confirmPO`, `createShipment`, `getSupplierShipments` | Create supplier account (+ User with SUPPLIER role). Create RFQ (auto-number, send to selected suppliers). Get all/supplier-specific RFQs. Submit quotation (price per item, delivery terms). View quotations for an RFQ. Accept quotation (auto-creates PO, updates RFQ status). Get POs (supplier view / manager view). Confirm PO. Create shipment (vehicle/driver/dates). Get supplier's shipments. |
| `dispatchController.ts` | `createDispatch`, `getAllDispatches`, `getDispatchByOrder`, `updateDispatchStatus` | Create dispatch (validates order is COMPLETED, generates dispatch number, updates order status to DISPATCHED, notifies customer). List all dispatches. Get dispatch by order ID. Update dispatch status (enforces valid transitions: PACKED→DISPATCHED→IN_TRANSIT→DELIVERED/RETURNED; auto-updates customer order to DELIVERED on delivery). |

### HR & Workforce

| File | Functions | What It Does |
|------|-----------|-------------|
| `attendanceController.ts` | `markAttendance`, `bulkMarkAttendance`, `getAttendanceByDate`, `getWorkerAttendance`, `getAttendanceSummary` | Mark single attendance (upsert by worker+date). Bulk mark attendance (array of worker attendance records for a shift). Get all attendance for a specific date. Get a worker's attendance history. Get monthly attendance summary aggregated by worker. |
| `leaveController.ts` | `createLeaveRequest`, `getLeaveRequests`, `updateLeaveStatus`, `getLeaveSummary` | Create leave request (calculate days between dates, link to worker). List leave requests (filter by status, worker). Approve/reject leave (update status, set approver, if approved and dates overlap today → update worker status to ON_LEAVE). Leave summary counts. |
| `shiftController.ts` | `createShift`, `getShifts`, `assignWorkers`, `deleteShift` | Create shift (upsert by name+date, pre-filled timings). List shifts (filter by date/name/range). Assign workers to shift (with capacity limit check). Delete shift. |

### Reports

| File | Functions | What It Does |
|------|-----------|-------------|
| `reportController.ts` | `getRecipients`, `addRecipient`, `updateRecipient`, `deleteRecipient`, `getConfig`, `updateConfig`, `generateReport`, `sendReport` | Email recipient CRUD (add/edit/delete report recipients). Report config management (enable/disable daily reports, set schedule). Generate on-demand report (returns summary data). Send report via email (generates PDF attachment, sends to all active recipients). |

---

## Routes (`routes/`) — 22 Files

All routes use `protect()` for authentication and `authorize(...roles)` for role-based access.

| File | Base Path | Endpoints | Allowed Roles |
|------|-----------|-----------|---------------|
| `authRoutes.ts` | `/api/auth` | `POST /register`, `POST /login`, `GET /`, `DELETE /:id` | register/delete: ADMIN; login: public; list: ADMIN/MANAGER |
| `materialRoutes.ts` | `/api/materials` | `GET /`, `GET /abc`, `GET /:id/procurement-context` | ADMIN, MANAGER, STORE_MANAGER, SUPERVISOR |
| `mrsRoutes.ts` | `/api/mrs` | `POST /`, `GET /my`, `GET /pending`, `GET /history`, `PUT /:id/issue`, `POST /return` | create/my/return: SUPERVISOR; pending/issue: STORE_MANAGER/MANAGER; history: all internal |
| `piRoutes.ts` | `/api/pi` | `POST /`, `GET /`, `PUT /:id/status`, `POST /:id/inward` | create/inward: STORE_MANAGER; list: STORE_MANAGER/MANAGER; approve: MANAGER |
| `analyticsRoutes.ts` | `/api/analytics` | `GET /dashboard`, `GET /inventory-health`, `GET /procurement-performance`, `GET /efficiency`, `GET /cost`, `GET /forecast`, `GET /workers/*`, `GET /suppliers/*`, `GET /hr-dashboard` | ADMIN, MANAGER, STORE_MANAGER (HR routes also: HR_MANAGER) |
| `notificationRoutes.ts` | `/api/notifications` | `GET /`, `PUT /:id/read`, `PUT /read-all` | All authenticated |
| `transactionRoutes.ts` | `/api/transactions` | `GET /:materialId` | ADMIN, MANAGER, STORE_MANAGER |
| `supplierRoutes.ts` | `/api/suppliers` | `GET /`, `GET /:id/analytics` | ADMIN, MANAGER |
| `auditRoutes.ts` | `/api/audit` | `GET /`, `GET /export/csv` | ADMIN, MANAGER |
| `machineRoutes.ts` | `/api/machines` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` | GET: ADMIN/MANAGER/STORE_MANAGER/SUPERVISOR; CUD: STORE_MANAGER/MANAGER |
| `workerRoutes.ts` | `/api/workers` | `GET /`, `GET /available`, `POST /`, `PUT /:id`, `DELETE /:id` | GET: all internal; CUD: HR_MANAGER/MANAGER/ADMIN |
| `settingsRoutes.ts` | `/api/settings` | `GET /`, `PUT /utilities` | ADMIN, MANAGER |
| `productionBatchRoutes.ts` | `/api/production-batches` | `GET /`, `GET /monitor`, `POST /`, `GET /:id`, `PUT /:id/start`, `PUT /:id/complete` | schedule/start/complete: SUPERVISOR; monitor: STORE_MANAGER/MANAGER/ADMIN; list: all internal |
| `productionAnalyticsRoutes.ts` | `/api/production-analytics` | `GET /dashboard` | ADMIN, MANAGER, STORE_MANAGER |
| `fabricLotRoutes.ts` | `/api/fabric-lots` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` | GET: all internal; CUD: SUPERVISOR/MANAGER |
| `reportRoutes.ts` | `/api/reports` | `GET /recipients`, `POST /recipients`, `PUT /recipients/:id`, `DELETE /recipients/:id`, `GET /config`, `PUT /config`, `GET /generate`, `POST /send` | ADMIN, MANAGER |
| `customerOrderRoutes.ts` | `/api/customer` | `POST /customers`, `GET /customers`, `POST /orders`, `GET /orders`, `GET /orders/:id`, `GET /all-orders`, `PUT /orders/:id/approve`, `PUT /orders/:id/status` | customer CRUD: ADMIN/MANAGER; order creation: CUSTOMER; my orders: CUSTOMER; all orders/approve/status: MANAGER |
| `supplierPortalRoutes.ts` | `/api/supplier` | `POST /accounts`, `POST /rfq`, `GET /rfq`, `GET /rfq/:rfqId/quotations`, `PUT /quotations/:id/accept`, `GET /purchase-orders`, `GET /my-rfq`, `POST /quotation`, `GET /my-purchase-orders`, `PUT /purchase-orders/:id/confirm`, `POST /shipment`, `GET /my-shipments` | accounts/rfq management: MANAGER/STORE_MANAGER; supplier-specific (my-*): SUPPLIER |
| `dispatchRoutes.ts` | `/api/dispatch` | `POST /`, `GET /`, `GET /order/:orderId`, `PUT /:id/status` | STORE_MANAGER, MANAGER (GET also ADMIN) |
| `attendanceRoutes.ts` | `/api/attendance` | `POST /`, `POST /bulk`, `GET /date`, `GET /worker/:workerId`, `GET /summary` | HR_MANAGER, MANAGER, ADMIN (POST also SUPERVISOR) |
| `leaveRoutes.ts` | `/api/leaves` | `POST /`, `GET /`, `GET /summary`, `PUT /:id/status` | HR_MANAGER, MANAGER, ADMIN (POST also SUPERVISOR) |
| `shiftRoutes.ts` | `/api/shifts` | `POST /`, `GET /`, `PUT /:id/assign`, `DELETE /:id` | HR_MANAGER, MANAGER, ADMIN (POST also SUPERVISOR) |

---

## Services (`services/`) — 3 Files

| File | Exports | What It Does |
|------|---------|-------------|
| `emailService.ts` | `sendReportEmail(recipients, subject, text, attachments)` | Nodemailer-based email sending. Uses SMTP configuration from env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). Supports file attachments for report PDFs. |
| `reportDataService.ts` | `getDailyActivitySummary(startDate, endDate)` | Aggregates daily activity data: completed production batches, MRS created/resolved, inventory changes (inwards/issues), audit log counts, and module-level breakdowns. Used by the report generator and the reports API. |
| `reportFileService.ts` | `generatePDFReport()` | PDF report generation using PDFKit. Creates branded report with "Golden Textile Dyers" letterhead, GSTIN, page borders, formatted tables, and summary sections. Saves to `server/reports/` directory. |

---

## Utils (`utils/`) — 1 File

| File | Exports | What It Does |
|------|---------|-------------|
| `cronJobs.ts` | `initCronJobs()` | Initializes scheduled tasks using `node-cron`. Runs automated daily system report at **08:00 AM** every day — checks if reports are enabled in ReportConfig, fetches active email recipients, generates PDF via `reportFileService`, and emails to all recipients via `emailService`. |

---

## Scripts (`scripts/`) — 1 File

| File | What It Does |
|------|-------------|
| `seedUsers.ts` | Database seeder script. Run with `npx ts-node src/scripts/seedUsers.ts`. Creates 5 default internal user accounts (see table below). Skips creation if username already exists. Passwords are bcrypt-hashed (10 salt rounds). |

### Default Seeded Users

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | ADMIN |
| `manager` | `manager123` | MANAGER |
| `store` | `store123` | STORE_MANAGER |
| `supervisor` | `supervisor123` | SUPERVISOR |
| `hr` | `hr123` | HR_MANAGER |

> **CUSTOMER** and **SUPPLIER** accounts are created through the application by ADMIN/MANAGER users. They are not part of the seed script.

---

## File Count Summary

| Category | Count |
|----------|-------|
| Core Files | 3 |
| Middleware | 2 |
| Models | 25 |
| Controllers | 22 |
| Routes | 22 |
| Services | 3 |
| Utils | 1 |
| Scripts | 1 |
| **Total** | **79** |
