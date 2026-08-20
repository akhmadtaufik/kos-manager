# KosManager Enterprise API Reference Manual

Welcome to the **KosManager REST API Reference**. This documentation provides comprehensive details on all 43 backend endpoints across 10 architectural domains, including authentication, Role-Based Access Control (RBAC) micro-permissions, financial accounting integrity, time-series analytics, and Kemendagri geographical standards.

---

## Table of Contents
1. [General Architecture & Standards](#1-general-architecture--standards)
2. [Authentication & Session Lifecycle](#2-authentication--session-lifecycle)
3. [RBAC & Micro-Permissions Matrix](#3-rbac--micro-permissions-matrix)
4. [Properties API Domain](#4-properties-api-domain)
5. [Rooms API Domain](#5-rooms-api-domain)
6. [Tenants API Domain (360 Profile & Lifecycle)](#6-tenants-api-domain-360-profile--lifecycle)
7. [Payments & Invoicing API Domain](#7-payments--invoicing-api-domain)
8. [Expenses & Categories API Domain](#8-expenses--categories-api-domain)
9. [Staff & Operator Management API Domain](#9-staff--operator-management-api-domain)
10. [Audit Trail & Governance API Domain](#10-audit-trail--governance-api-domain)
11. [Analytics, Reports & Time-Series API Domain](#11-analytics-reports--time-series-api-domain)
12. [Kemendagri Regional Standardization API Domain](#12-kemendagri-regional-standardization-api-domain)

---

## 1. General Architecture & Standards

### Base URL
All API routes are served under the `/api` prefix:
```
http://localhost:3000/api
```
Interactive Scalar UI documentation is available at `/docs` (served via `/_openapi.json`).

### Standardized Response Envelope
All API endpoints return JSON conforming to the `UniversalResponse` envelope:

#### Success Response (`200 OK` / `201 Created`)
```json
{
  "status": "success",
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... },
  "reqId": "REQ-a1b2c3"
}
```

#### Standard Error Response (`400`, `401`, `403`, `404`, `409`, `500`)
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Format email tidak valid"
    }
  ],
  "reqId": "REQ-a1b2c3"
}
```

### Correlation ID (`reqId`)
Every incoming HTTP request is automatically assigned a unique 6-character hex identifier prefixed with `REQ-` (e.g. `REQ-f4a21e`). This identifier is propagated to Pino structured logs and attached to every API response for auditability and debugging.

---

## 2. Authentication & Session Lifecycle

Authentication is managed using NextAuth/NuxtAuth with persistent HTTP-only cookie sessions.

### Security Scheme
- **Type:** Cookie Authentication
- **Cookie Name:** `next-auth.session-token` (or `__Secure-next-auth.session-token` in production HTTPS)

### Endpoints

#### 1. `POST /api/auth/register`
Registers a new user account with secure `bcrypt` salt-hashed passwords (12 rounds).

- **Authentication:** Public
- **Request Body:**
  ```json
  {
    "name": "Budi Hartono",
    "email": "budi@example.com",
    "password": "strongpassword123",
    "role": "owner" // Options: "owner" | "operator" | "pending"
  }
  ```
- **Responses:**
  - `201 Created`: User successfully registered.
  - `400 Bad Request`: Validation failure (e.g., password < 6 characters).
  - `409 Conflict`: Email already exists.

#### 2. `POST /api/user/role`
Assigns initial role for users currently in `pending` status.

- **Authentication:** Required (User role must be `pending`)
- **Request Body:**
  ```json
  {
    "role": "owner" // Options: "owner" | "operator"
  }
  ```
- **Responses:**
  - `200 OK`: Role successfully set.
  - `400 Bad Request`: User role has already been set or invalid selection.

---

## 3. RBAC & Micro-Permissions Matrix

KosManager enforces granular Role-Based Access Control. While Superadmins and Owners possess full governance across their properties, Operators can be assigned specific micro-permissions:

| Domain | Micro-Permission | Legacy Macro Alias | Allowed Actions |
| :--- | :--- | :--- | :--- |
| **Rooms** | `rooms:read` | `manage_rooms` | View room lists and details |
| | `rooms:create` | `manage_rooms` | Add new rooms to property |
| | `rooms:update` | `manage_rooms` | Update room rates and fees |
| | `rooms:delete` | `manage_rooms` | Remove vacant rooms |
| **Tenants** | `tenants:read` | `manage_tenants` | View tenant profiles |
| | `tenants:create` | `manage_tenants` | Onboard new tenants & assign rooms |
| | `tenants:update` | `manage_tenants` | Edit tenant info & perform checkout |
| | `tenants:delete` | `manage_tenants` | Remove tenant records |
| **Payments** | `payments:read` | `manage_payments` | View invoices and transaction ledgers |
| | `payments:create` | `manage_payments` | Bulk generate monthly invoices |
| | `payments:update` | `manage_payments` | Record partial payments & mark paid |
| | `payments:delete` | `manage_payments` | Void invoice records |
| **Expenses** | `expenses:read` | `manage_expenses` | View expense records |
| | `expenses:create` | `manage_expenses` | Record operational expenses |
| | `expenses:update` | `manage_expenses` | Update expense records & custom categories |
| | `expenses:delete` | `manage_expenses` | Delete expense records |
| **Reports** | `reports:read` | `view_reports` | View executive dashboards, MoM metrics & P&L |

> [!IMPORTANT]
> - Attempting an action without the required micro-permission returns `403 Forbidden`.
> - Staff management (`/api/staff/*`) and property deletion (`DELETE /api/properties/*`) are strictly restricted to **Owners** and **Superadmins**.

---

## 4. Properties API Domain

### Endpoints

#### 1. `GET /api/properties`
Fetches all properties accessible to the authenticated user along with real-time aggregated metrics (`totalRooms` and `occupiedRooms`).

- **Authentication:** Required
- **Responses:**
  - `200 OK`:
    ```json
    {
      "status": "success",
      "statusCode": 200,
      "message": "Properties retrieved successfully",
      "data": [
        {
          "id": "prop-123",
          "userId": "usr-456",
          "name": "Kos Sakura Residence",
          "address": "Jl. Margonda Raya No. 45, Depok",
          "totalRooms": 15,
          "occupiedRooms": 12,
          "createdAt": "2026-08-01T10:00:00.000Z",
          "updatedAt": "2026-08-15T12:00:00.000Z"
        }
      ]
    }
    ```

#### 2. `POST /api/properties`
Creates a new property branch.

- **Authentication:** Required (Role: `owner` or `superadmin`)
- **Request Body:**
  ```json
  {
    "name": "Kos Anggrek Premium",
    "address": "Jl. Gejayan No. 20, Yogyakarta"
  }
  ```
- **Responses:** `200 OK`

#### 3. `PATCH /api/properties/:id`
Updates property metadata.

- **Authentication:** Required (Owner of property or superadmin)
- **Request Body:**
  ```json
  {
    "name": "Kos Anggrek Residence VIP",
    "address": "Jl. Gejayan No. 22, Yogyakarta"
  }
  ```

#### 4. `DELETE /api/properties/:id`
Removes a property and associated cascades.

- **Authentication:** Required (Owner only)
- **Responses:**
  - `200 OK`: Deleted successfully.
  - `400 Bad Request`: If foreign key constraints exist on active rooms or payments.

---

## 5. Rooms API Domain

### Endpoints

#### 1. `GET /api/rooms`
Retrieves rooms for a property with optional status filtering.

- **Query Parameters:**
  - `propertyId` (string, optional): Target property ID.
  - `status` (string, optional): Filter by `available` | `occupied` | `maintenance`.
- **Responses:**
  - `200 OK`: Array of room records with `monthlyRate` and `additionalFees`.

#### 2. `POST /api/rooms`
Creates a room within a property.

- **Permissions Required:** `rooms:create`
- **Request Body:**
  ```json
  {
    "propertyId": "prop-123",
    "roomNumber": "101",
    "monthlyRate": 1500000,
    "additionalFees": [
      { "name": "AC & Listrik Ekstra", "amount": 200000 },
      { "name": "Parkir Mobil", "amount": 100000 }
    ]
  }
  ```

#### 3. `PATCH /api/rooms/:id`
Updates room rate, capacity, or fees.

- **Permissions Required:** `rooms:update`
- **Request Body:**
  ```json
  {
    "roomNumber": "101-A",
    "monthlyRate": 1600000,
    "additionalFees": []
  }
  ```

#### 4. `DELETE /api/rooms/:id`
Deletes a vacant room.

- **Permissions Required:** `rooms:delete`
- **Responses:**
  - `400 Bad Request`: If the room is currently occupied by an active tenant.

---

## 6. Tenants API Domain (360 Profile & Lifecycle)

### Endpoints

#### 1. `GET /api/tenants`
Lists active or past tenants filtered by property.

- **Query Parameters:** `propertyId`, `search`, `page`, `limit`
- **Permissions Required:** `tenants:read`

#### 2. `GET /api/tenants/:id`
Retrieves comprehensive 360-degree tenant dossier including Kemendagri origin and financial ledger.

- **Permissions Required:** `tenants:read`
- **Response Payload (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "id": "tnt-123",
      "name": "Budi Santoso",
      "phone": "081234567890",
      "emergencyContact": "Ibu Siti (081298765432)",
      "checkIn": "2026-08-01",
      "checkOut": null,
      "isActive": 1,
      "location": {
        "province": "DKI JAKARTA",
        "regency": "KOTA ADM. JAKARTA PUSAT",
        "district": "GAMBIR"
      },
      "room": {
        "id": "room-101",
        "roomNumber": "101",
        "monthlyRate": "1500000",
        "property": { "id": "prop-123", "name": "Kos Melati" }
      },
      "financial": {
        "totalArrears": 500000,
        "unpaidInvoicesCount": 1,
        "totalInvoicesCount": 3,
        "recentPayments": [ ... ]
      }
    }
  }
  ```

#### 3. `POST /api/tenants`
Onboards a new tenant and automatically transitions room status from `available` $\rightarrow$ `occupied`.

- **Permissions Required:** `tenants:create`
- **Request Body:**
  ```json
  {
    "propertyId": "prop-123",
    "roomId": "room-101",
    "name": "Andi Pratama",
    "phone": "08122334455",
    "emergencyContact": "Ayah (0811223344)",
    "checkIn": "2026-08-20",
    "provinceId": "31",
    "regencyId": "3171",
    "districtId": "3171010"
  }
  ```

#### 4. `PATCH /api/tenants/:id`
Updates tenant details OR executes a checkout action (`action: 'checkout'`).

- **Permissions Required:** `tenants:update`
- **Checkout Request Body:**
  ```json
  {
    "action": "checkout"
  }
  ```
  *Effect: Sets `isActive = 0`, records checkout timestamp, and automatically resets the assigned room status to `available`.*

---

## 7. Payments & Invoicing API Domain

### Accounting Formula
$$\text{Total Invoice Amount} = \text{Base Rent} + \sum (\text{Additional Fees})$$

### Endpoints

#### 1. `POST /api/payments/generate`
Bulk generates monthly invoices for all active tenants in a property for a specific billing month.

- **Permissions Required:** `payments:create`
- **Request Body:**
  ```json
  {
    "propertyId": "prop-123",
    "billingMonth": "2026-09"
  }
  ```
- **Features:** Idempotent (running multiple times will not duplicate existing invoices).

#### 2. `GET /api/payments`
Lists payment records with real-time financial totals (`totalBilled`, `totalPaid`, `totalOutstanding`).

- **Query Parameters:** `propertyId`, `billingMonth`
- **Permissions Required:** `payments:read`

#### 3. `POST /api/payments/:id/transactions`
Records installment or partial payment transactions with automatic arrears rollover distribution.

- **Permissions Required:** `payments:update`
- **Request Body:**
  ```json
  {
    "amount": 750000,
    "notes": "Cicilan ke-1 via Transfer BCA"
  }
  ```
- **Validation Rules & Status Transitions:**
  - If `amount <= 0` $\rightarrow$ `400 Bad Request`.
  - If `amount > remainingDebt` $\rightarrow$ `400 Bad Request`.
  - If `amountPaid < totalAmount` $\rightarrow$ Status transitions to `partial`.
  - If `amountPaid == totalAmount` $\rightarrow$ Status transitions to `paid`.

#### 4. `PATCH /api/payments/:id`
Marks an invoice as fully paid.

- **Permissions Required:** `payments:update`

---

## 8. Expenses & Categories API Domain

### Endpoints

#### 1. `GET /api/expenses/categories`
Retrieves all 9 default system categories plus custom user-created categories.

- **9 Default System Categories:**
  1. `Listrik & Daya (PLN)` (`PhLightning`, `bg-amber-500`)
  2. `Air Bersih & Sanitasi (PDAM)` (`PhDrop`, `bg-sky-500`)
  3. `Kebersihan & Iuran Sampah` (`PhTrash`, `bg-emerald-500`)
  4. `Gaji & Honor Karyawan` (`PhUsersThree`, `bg-blue-500`)
  5. `Pajak Bumi & Bangunan (PBB)` (`PhReceipt`, `bg-indigo-500`)
  6. `Zakat & Infaq Usaha` (`PhHandHeart`, `bg-teal-500`)
  7. `Santunan & Donasi Sosial` (`PhHeart`, `bg-rose-500`)
  8. `Pemeliharaan & Renovasi` (`PhWrench`, `bg-orange-500`)
  9. `Komisi & Marketing Agen` (`PhMegaphoneSimple`, `bg-purple-500`)

#### 2. `POST /api/expenses/categories`
Creates a custom expense category.

- **Permissions Required:** `expenses:create`
- **Request Body:**
  ```json
  {
    "name": "Langganan CCTV Cloud",
    "icon": "PhVideoCamera",
    "color": "bg-violet-500"
  }
  ```

#### 3. `GET /api/expenses` & `POST /api/expenses`
Records and lists operational expenditures.

---

## 9. Staff & Operator Management API Domain

### Endpoints

#### 1. `GET /api/staff`
Lists all operators assigned to a property.

- **Authentication:** Required (Owner only)
- **Query Parameter:** `propertyId`

#### 2. `POST /api/staff`
Invites an operator and assigns specific micro-permissions.

- **Authentication:** Required (Owner only)
- **Request Body:**
  ```json
  {
    "propertyId": "prop-123",
    "email": "operator@example.com",
    "permissions": [
      "rooms:read",
      "tenants:read",
      "tenants:create",
      "payments:read",
      "payments:update"
    ]
  }
  ```

#### 3. `PATCH /api/staff/:userId`
Modifies assigned micro-permissions.

#### 4. `DELETE /api/staff/:userId`
Revokes an operator's property assignment.

---

## 10. Audit Trail & Governance API Domain

### Endpoints

#### 1. `GET /api/audit`
Retrieves human-generated administrative activity logs with anti-fraud filters.

- **Authentication:** Required (Owner or Superadmin only; operators receive `403 Forbidden`)
- **Query Parameters:**
  - `page` (number, default: 1)
  - `limit` (number, default: 15)
  - `role` (string: `all` | `owner` | `operator`)
  - `actorId` (string, optional: filter by specific operator)

#### 2. `GET /api/audit/operators`
Returns list of unique operators who have recorded activities for audit filter dropdowns.

---

## 11. Analytics, Reports & Time-Series API Domain

### Endpoints

#### 1. `GET /api/reports/rekap`
Computes executive KPI summary cards with live Month-over-Month (MoM) percentage deltas.

- **Query Parameters:** `propertyId`, `month` (format: `YYYY-MM`)
- **Permissions Required:** `reports:read`
- **MoM Formula:**
  $$\text{MoM \%} = \frac{\text{Current} - \text{Previous}}{|\text{Previous}|} \times 100$$
- **Response Structure:**
  ```json
  {
    "status": "success",
    "data": {
      "totalRooms": 20,
      "occupiedRooms": 16,
      "occupancyRate": 80.0,
      "revenue": 24000000,
      "expenses": 4500000,
      "netProfit": 19500000,
      "mom": {
        "revenueMoM": 12.5,
        "expensesMoM": -3.2,
        "netProfitMoM": 16.8,
        "occupancyRateMoM": 5.0,
        "occupiedRoomsDelta": 1
      }
    }
  }
  ```

#### 2. `GET /api/analytics/pnl-trend`
Generates a 6-month trailing sliding window of financial revenue, operational expenses, and net profit.

- **Query Parameters:** `propertyId`, `month`
- **Response Structure:**
  ```json
  {
    "status": "success",
    "data": [
      { "month": "2026-03", "label": "Mar", "revenue": 18000000, "expenses": 3000000, "netProfit": 15000000 },
      { "month": "2026-04", "label": "Apr", "revenue": 20000000, "expenses": 3200000, "netProfit": 16800000 },
      { "month": "2026-05", "label": "Mei", "revenue": 21000000, "expenses": 4000000, "netProfit": 17000000 },
      { "month": "2026-06", "label": "Jun", "revenue": 22000000, "expenses": 3800000, "netProfit": 18200000 },
      { "month": "2026-07", "label": "Jul", "revenue": 23500000, "expenses": 4100000, "netProfit": 19400000 },
      { "month": "2026-08", "label": "Agu", "revenue": 24000000, "expenses": 4500000, "netProfit": 19500000 }
    ]
  }
  ```

#### 3. `GET /api/analytics/demographics`
Aggregates tenant origin distribution strictly mapped to Indonesian Kemendagri geographical codes.

- **Query Parameters:**
  - `propertyId` (string, optional)
  - `level` (string: `regency` [default] | `province`)
- **Responses (`level=regency`):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "3171",
        "name": "KOTA ADM. JAKARTA PUSAT",
        "type": "KOTA",
        "total": 8,
        "percentage": 50.0
      },
      {
        "id": "3201",
        "name": "KABUPATEN BOGOR",
        "type": "KABUPATEN",
        "total": 4,
        "percentage": 25.0
      }
    ]
  }
  ```

---

## 12. Kemendagri Regional Standardization API Domain

Cascading geographical data endpoints supporting both camelCase and snake_case parameters.

### Endpoints

#### 1. `GET /api/regions/provinces`
Retrieves all 34 official Indonesian provinces.

#### 2. `GET /api/regions/regencies`
Retrieves regencies and cities filtered by province ID.
- **Query Parameter:** `provinceId` or `province_id` (e.g. `31` for DKI Jakarta).

#### 3. `GET /api/regions/districts`
Retrieves districts (kecamatan) filtered by regency ID.
- **Query Parameter:** `regencyId` or `regency_id` (e.g. `3171` for Kota Adm. Jakarta Pusat).
