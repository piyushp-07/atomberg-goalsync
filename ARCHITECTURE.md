# 📐 Atomberg GoalSync Pro - System Architecture Specification

This document details the software architecture, database layers, and data flow pipelines of the Atomberg GoalSync Pro Portal.

---

## 1. High-Level Architectural Flow (Mermaid Diagram)

The following diagram illustrates how the frontend presentation layer, backend Express controller tier, cloud database cluster, and real-time syncing pipelines interact:

```mermaid
graph TD
    %% Presentation Tier
    subgraph Client [Presentation Tier - React Client]
        A["Vite + React SPA"] -->|HTTPS Requests + Bearer JWT| B["Axios Client Instance"]
    end

    %% API Gateway & Auth Tier
    subgraph Server [Logic Tier - Express.js Backend]
        B -->|REST API Calls| C["Express.js Server Gateway"]
        C --> D{"JWT Auth & RBAC Middleware"}
        D -->|Allow Role Access| E["Express Router Nodes"]
    end

    %% Database & Notification Tier
    subgraph Storage [Database & Integrations Tier]
        E -->|Mongoose Queries| F[("MongoDB Atlas Cloud DB")]
        E -->|Trigger Outbound Alerts| G["notifier.js Alert Dispatcher"]
        G -->|Log Simulated Outgoing Alerts| H[("NotificationLog Collection")]
    end

    %% Cascade Sync Tier
    subgraph RealTimeSync [KPI Sync Pipeline]
        F -->|Master Owner check-in logged| I["checkInController.js Cascade Handler"]
        I -->|Auto-propagate scores & achievements| J["Recipient Employee Sheets"]
    end

    %% Custom Styles
    style A fill:#FFC20E,stroke:#000,stroke-width:2px,color:#000
    style C fill:#181717,stroke:#FFC20E,stroke-width:2px,color:#FFF
    style F fill:#47A248,stroke:#000,stroke-width:2px,color:#FFF
    style G fill:#007ACC,stroke:#000,stroke-width:2px,color:#FFF
```

---

## 2. Tier Breakdown & Layer Specs

### A. Presentation Layer (Vite + React Client)
*   **Decoupled Single Page Application (SPA)** using Vite for near-instant compilation and rendering.
*   **State Management**: React Context (`AuthContext`) manages state persistence, maintaining the JWT session across window reloads.
*   **API Interceptor**: Axios instance configured with an request interceptor to automatically attach `Authorization: Bearer <token>` header to all REST requests.
*   **Visualization Engine**: Recharts models render visual analytics showing goal status distribution and check-in score trends.

### B. Business Logic Layer (Node + Express Backend)
*   **Authentication Engine**: JWT signing and verification middleware, handling token parsing.
*   **Role-Based Access Control (RBAC)**: Custom routing middleware (`authorize(['Admin', 'Manager', 'Employee'])`) blocks unapproved requests.
*   **Shared Goal Engine**: Handlers in `goalController.js` and `checkInController.js` calculate dynamic UoM metrics (Min/Max/Timeline/Zero-Based) and cascade check-ins from master owner sheets to recipient sheets in real time.

### C. Storage Layer (MongoDB Atlas Cluster)
*   **Cloud Hosted DB**: Connected to a highly scalable M0 free cluster.
*   **Mongoose Data Schemas**:
    *   `User`: Holds roles (Admin, Manager, Employee), hashed passwords (bcrypt), and personal profiles.
    *   `Goal`: Holds Thrust Area, Title, UoM targets, weightages, completion status, and `sharedFromId` linkages.
    *   `CheckIn`: Records quarter progress, comments, calculated score metrics, and verification file references.
    *   `NotificationLog`: Audit trail of simulated communication dispatches (Email & MS Teams Adaptive Cards).
    *   `AuditLog`: Track governance overrides (locked sheet unlocks) with formal reason tracking.
