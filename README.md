# Consultancy Project

A comprehensive management system built with a modern tech stack, designed to handle inventory, user management, reporting, and process approvals efficiently.

## 🚀 Tech Stack

### Frontend
- **Framework:** [React](https://reactjs.org/) (powered by [Vite](https://vitejs.dev/))
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **State/Notifications:** React Hot Toast

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT (JSON Web Tokens) & Bcrypt
- **CORS:** Enabled for secure cross-origin requests

## ✨ Features

- **Dashboard:** Overview of key metrics and activities.
- **User Management:** Admin controls for managing users and roles.
- **Inventory Management:** Track materials, stock levels, and inward entries.
- **Purchase Indents (PI):** Raise and approve purchase indents with a streamlined workflow.
- **Reports & Analytics:** Visual insights and downloadable reports for data-driven decisions.
- **Notifications:** Real-time updates for important actions and alerts.
- **Authentication:** Secure login and role-based access control.

## 🔮 Future Enhancements

The following features are planned to further elevate the platform:

1.  **Mobile Application:** A dedicated mobile app for on-the-go access to approvals and reports.
2.  **Advanced Analytics:** AI-driven predictive analytics for inventory forecasting and trend analysis.
3.  **Third-Party Integrations:** Seamless integration with popular ERP and accounting software (e.g., Tally, SAP).
4.  **Automated Notifications:** SMS and Email alerts for critical stock levels and pending approvals.
5.  **Multi-Language Support:** Localization to support a diverse user base.
6.  **Audit Logs:** Comprehensive activity logging for enhanced security and accountability.
7.  **Supplier Portal:** A dedicated interface for vendors to track orders and payments.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local or Atlas)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/nitheesh1122/Consultancy_Project.git
    cd Consultancy_Project
    ```

2.  **Install dependencies:**
    ```bash
    # Install server dependencies
    cd server
    npm install

    # Install client dependencies
    cd ../client
    npm install
    ```

3.  **Environment Setup:**
    - Configure `.env` files in both `client` and `server` directories with necessary secrets and API endpoints.

4.  **Run the application:**
    ```bash
    # Start server (from server directory)
    npm run dev

    # Start client (from client directory)
    npm run dev
    ```

## 📄 License

This project is licensed under the MIT License.
