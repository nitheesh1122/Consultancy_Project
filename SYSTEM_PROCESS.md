# System Process: From Procurement to Production

This document outlines the complete, step-by-step lifecycle of operations within the **Textile Consultancy Management System**, detailing how materials flow from initial procurement down to the factory floor for production, and how each user role interacts with the system at every stage.

---

## 🎭 User Roles Overview

Before diving into the process, it's essential to understand who uses the system and their primary views:

1.  **Admin (Owner / Executive):**
    *   *View:* High-level dashboards, Analytics, PI Approvals, Supplier Management, Audit Logs.
    *   *Goal:* Cost control, efficiency monitoring, and supplier assessment.
2.  **Store Manager (Inventory Controller):**
    *   *View:* Inventory list, Inward Entry, Raise PI, Notifications.
    *   *Goal:* Ensure materials are in stock, manage vendor deliveries, and verify physical stock matches digital stock.
3.  **Supervisor (Floor Manager):**
    *   *View:* Material Request (MRS), Return Material.
    *   *Goal:* Procure necessary materials for the daily production batches without delays.

---

## 🔄 The Core Workflow

### Phase 1: Procurement & Stock Maintenance (The Pre-requisite)
*Before production can begin, the store must have stock.*

**Step 1.1: Identifying Low Stock**
*   **System:** Continuously monitors inventory. If a dye/chemical drops below its predetermined `minStock` level, it flags the item.
*   **Store Manager's View:** Logs in and sees an alert on the Dashboard for "Low Stock Items".
*   **Action:** Manager decides to order more. They navigate to **Raise PI** (Purchase Indent).

**Step 1.2: Raising the Purchase Indent (PI)**
*   **Store Manager's View:** Selects the required material, enters the quantity, chooses a Supplier (e.g., Colourtex), and submits the request. The PI status becomes `RAISED`.

**Step 1.3: Executive Approval**
*   **Admin's View:** Receives a notification. Navigates to **PI Approvals**. They can review the requested quantity, the cost, and the supplier's past reliability score (Procurement Context).
*   **Action:** The Admin clicks **Approve**. The PI status updates to `APPROVED`.

**Step 1.4: Inward Entry (Delivery Arrival)**
*   **Store Manager's View:** The supplier's delivery truck arrives at the factory. The Manager opens **Inward Entry**, selects the approved PI, verifies the physical delivery against the digital invoice, and marks it as `COMPLETED`.
*   **System Action:** The inventory quantity for that material automatically increases. An `INWARD` transaction is permanently logged.

---

### Phase 2: Lot / Batch Initiation (Production Start)
*The factory receives an order to dye a "Lot" of fabric (e.g., 500kg of cotton to be dyed Reactive Red).*

**Step 2.1: Material Requisition**
*   **Supervisor's View:** A new production batch (`BATCH-102`) is scheduled. The Supervisor knows they need 25kg of Reactive Red dye and 10kg of Caustic Soda.
*   **Action:** Navigates to **Request Material**, inputs the `Batch ID`, selects the required materials and quantities, and submits the Material Requisition Slip (MRS).

**Step 2.2: Material Issuance**
*   **Store Manager's View:** A notification pops up that a Supervisor needs materials. The Manager physically weighs the materials and hands them over to the factory floor worker.
*   **Action:** Manager confirms the issuance in the system.
*   **System Action:** Inventory quantity is instantly deducted. An `ISSUE` transaction is permanently logged, tying the material cost directly to `BATCH-102`.

---

### Phase 3: Production Floor Operations
*The materials are now at the dyeing machines.*

**Step 3.1: Machine & Worker Allocation**
*   **System Application:** The specific dyeing machine used (e.g., Soft Flow Machine A) and the Worker/Supervisor shift managing the batch are recorded (via the Production & HR module). 

**Step 3.2: Adjusting Material Usage (Exception Handling)**
*   *Scenario A: Excess Material.* The Supervisor only used 23kg of dye instead of 25kg.
    *   **Supervisor's View:** Uses the **Return Material** screen to return the 2kg to the store.
    *   **System Action:** Logs a `RETURN` transaction, adding 2kg back to inventory and crediting the cost away from `BATCH-102`.
*   *Scenario B: Shortage.* The color wasn't deep enough; they need 2kg more.
    *   **Supervisor's View:** Raises a new MRS for `BATCH-102`.
    *   **System Action:** This second request for the same batch is flagged in Analytics as a "Re-issue," negatively impacting efficiency metrics.

---

### Phase 4: Closing the Loop (Analytics & Visibility)
*The batch is completed. Management reviews performance.*

**Admin's View (Analytics Dashboard):**
The Admin navigates to the **Analytics & Reports** section to review the day's/week's performance without ever stepping onto the factory floor:
1.  **Production Yield:** They check the `Production` tab to see how efficiently `BATCH-102` was dyed. Did it require re-issuances? What was the exact chemical cost per kg of dyed fabric?
2.  **Worker/Supervisor Efficiency:** Who supervised `BATCH-102`? Are they consistently using more dye than the theoretical recipe requires?
3.  **Supplier Performance:** Was the delivery of the Reactive Red dye delayed, causing `BATCH-102` to start late?
4.  **Cost Trends:** How much total capital was consumed in production today compared to last week?

### Summary of Data Flow
**Demand (MRS)** → **Depletes Inventory** → **Triggers Alert** → **Initiates Procurement (PI)** → **Requires Approval** → **Restocks Inventory (Inward)** → **Cycles back to Production.**
