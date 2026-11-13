# TDMS: Development Agent

This document outlines the architecture, setup, and operational guidelines for the TDMS, built with **.NET 10** and a **Custom SPA** frontend.

## 1. Project Architecture
The application's folder strcture will Features based **Vertical Slice Architecture**, ensuring that features are self-contained and maintainable.
Super
- **Backend:** .NET 10 API (Web API template).
- **Frontend:** Custom SPA (e.g., React/Vue/Vanilla JS) served via static files in `wwwroot` or proxied through Kestrel.
- **Database:** MySql (via EF Core).


All backend development must adhere to the following tools and libraries:
- **Language:** C#
- **Framework:** .NET 10 (Web API template)
- **Database:** MariaDb (via EF Core)
- **Documentation:** Swagger (OpenAPI)
- **Architecture:** Module-based with Vertical Slice Architecture
- **Security:** JWT Authentication
- **Validation:** FluentValidation
- **Testing** xUnit/Moq

All frontend development must adhere to the following tools and libraries:
- **Language:** TypeScript
- **Framework:** React
- **Build Tool:** Vite
- **Test Library:** Vitest
- **Data Fetching:** React Query (TanStack Query)
- **Routing:** React Router
- **Form Handling:** React Hook Form
- **UI Components:** shadcn/ui (styled with Tailwind CSS)
- **Icons:** Lucide Icons
- **Auth:** JWT Authentication
- **Theming:** Light/Dark Mode Support

## 2. Environment Setup
### Prerequisites
- .NET 10 SDK
- React/Vite (using Node.js)
- MariaDb Server

### Configuration
1. **API:** Configure `appsettings.json` and `appsettings.{EnvironmentName}.json` for Connection Strings and JWT Authentication.
2. **SPA:** Configure `vite.config.js` to output build artifacts to the `wwwroot/dist` folder.
3. **Middleware:** In `Program.cs`, ensure `app.UseStaticFiles()` and `app.MapFallbackToFile("index.html")` are configured for SPA routing.


## Overview Project Structure

```text
TDMS/
├── TDMS.slnx                       # Solution definition
├── AGENTS.md                           # AI Agent guidelines and architecture rules
├── src/
│   ├── TDMS.Api/                   # Backend Web API (.NET 10)
│   │   ├── Program.cs                  # Entry point, middleware pipeline, endpoints
│   │   ├── DependicyInjection.cs       # Service registrations (Auth, DB, Policies)
│   │   ├── Abstructions/               # App-wide abstractions and constants
│   │   │   ├── ResourceNames.cs        # Resource claims constants (e.g. users, roles)
│   │   │   ├── UIControlNames.cs       # Menu/UI permission claims constants
│   │   │   └── CurrentUser.cs          # Current user context accessor
│   │   ├── Database/                   # EF Core DbContext, migrations & seeding
│   │   │   ├── AppDbContext.cs         # Unified DbContext
│   │   │   ├── DatabaseSeedService.cs  # Database migrations & System Admin seeding
│   │   │   ├── Inteceptor/             # SaveChanges interceptors (e.g. Auditable)
│   │   │   └── Migrations/             # EF Core migration history
│   │   ├── Middlewares/                # Custom HTTP middlewares (e.g. Error handling)
│   │   └── Features/                   # Features-based Vertical Slice implementations
│   │   └── wwwroot/                    # Output target for compiled React SPA assets
│   │
│   └── TDMS.Spa/                       # Frontend SPA (React + Vite)
│       ├── package.json                # Dependencies and frontend scripts
│       ├── vite.config.js              # Vite build configuration (outputs to wwwroot/dist)
│       ├── index.html                  # HTML entry point
│       └── src/
       # Configured fetch wrapper with JWT headers
```

# Architectural Specification: Permission-Based Access Control (PBAC via Claims & RBAC)

## Authorization Architecture Overview
The application uses a **Fine-Grained Role-Based Access Control (RBAC)** model enforced through **Permission-Based Access Control (PBAC)** and **Claims-Based Authorization (JWT)**.

- **Users** are assigned to **Roles**.
- **Roles** hold discrete **Permissions** (stored as Role Claims).
- **Tokens (JWT)** flatten all role claims at login and carry them in the token payload.
- **Backend Endpoints** authorize access strictly based on **Permission Claims / Policies**, never directly against hardcoded Role names.
- **Frontend UI** conditionally renders menus and action buttons based on decoded claims from the JWT.

```
[User] ──(assigned)──> [Role] ──(assigned)──> [Permission Claim]
                                                      │
                                      ┌───────────────┴───────────────┐
                                      ▼                               ▼
                             [API Policy Gate]              [UI Component Gate]
```

---

## Permission Naming Standards

Permissions must strictly follow one of two standardized formats:

### A. Resource API Actions (CRUD / Operations)
Format: `{resource}:{action}`
- **`resource`**: Plural lowercase entity name (e.g., `users`, `products`, `orders`, `invoices`).
- **`action`**: Standardized verbs: `read`, `create`, `update`, `delete` (or domain verbs like `approve`, `export`).
- *Examples:* `users:read`, `orders:create`, `products:delete`

### B. UI Element & Navigation Visibility
Format: `view:menu:{menu_name}` or `nav:{sidebar_menu_name}`
- Used exclusively by the frontend to show or hide top-level sections and navigation items.
- *Examples:* `view:menu:administration`, `view:menu:finance`, `view:menu:reports`

---

## Database & IAM Structure

1. **Entities & Tables:**
   - `User` (`Id`, `Email`, `UserName`, ...)
   - `Role` (`Id`, `Name`)
   - `UserRole` (`UserId`, `RoleId`)
   - `RoleClaim` (`Id`, `RoleId`, `ClaimType`, `ClaimValue`) — where `ClaimType` is the permission string (e.g., `users:read`) and `ClaimValue` is `"true"`.

2. **Seeding & Admin Rule:**
   - Seed an `"SystemAdmin"` role automatically on database initialization.
   - The seed process must automatically discover all registered resources and UI controls and assign 100% of permissions to `"SystemAdmin"`.
   - Seed a default Admin user account assigned to `"SystemAdmin"`.

---

## Backend Implementation Requirements

### A. Token Generation (Login Flow)
1. Upon successful password validation, resolve all roles assigned to the user.
2. Query all `RoleClaim` records belonging to those roles.
3. Deduplicate claims across multiple roles.
4. Issue a signed JWT containing standard user claims (`sub`, `userid`, `email`), the user's roles, and each permission claim as a discrete claim entry:
   ```json
   {
     "sub": "user@example.com",
     "userid": "guid-here",
     "role": "Manager",
     "orders:read": "true",
     "orders:create": "true",
     "view:menu:finance": "true"
   }
   ```

### B. Policy Registration
1. Define a central static class (e.g., `ResourceNames` / `Permissions`) declaring all resources and actions.
2. Register policies dynamically or cleanly in service configuration:
   ```csharp
   foreach (var resource in ResourceNames.All)
   {
       foreach (var action in new[] { "read", "create", "update", "delete" })
       {
           var perm = $"{resource}:{action}";
           builder.AddPolicy(perm, policy => policy.RequireClaim(perm));
       }
   }
   ```

### C. Endpoint Protection
- **Rule:** Never use `[Authorize(Roles = "Admin")]` or `RequireAuthorization("Admin")` on domain endpoints.
- **Always use:**
  - Minimal APIs: `.RequireAuthorization("users:read")`
  - Controllers: `[Authorize(Policy = "users:read")]`

---

## Frontend Implementation Requirements

### A. Authentication & Claims Storage
1. Decode the JWT payload upon receiving it on login (or hydrating from storage).
2. Store user claims in global context / state management (`user.claims`).

### B. Permission Helper / Component Gate
1. Implement a `<HasPermission permission="...">` wrapper component and a `useHasPermission(permission)` custom hook.
2. **Evaluation logic:**
   - If user is not authenticated: return `false` / fallback.
   - If user has the `"SystemAdmin"` role: bypass check and return `true` immediately.
   - If `user.claims[permission]` is truthy: return `true`.
   - Otherwise: return `false`.

### C. UI Protection Guidelines
- **Navigation & Sidebars:** Wrap top-level menus in `<HasPermission permission="view:menu:{module}">`.
- **Buttons / Actions:** Wrap sensitive actions (e.g., "Add User", "Delete", "Export") in `<HasPermission permission="{resource}:{action}">`.
- *Note:* Frontend checks are for UX only; security must always be enforced on the backend.

---

## Permission Management Module (IAM)
The administrative area must provide:
1. **Roles Management:** Create/edit roles and toggle checkboxes for all registered `{resource}:{action}` and `view:menu:*` claims.
2. **User Role Assignment:** Assign users to one or multiple roles.
3. Access to permission/role management must be restricted strictly to SystemAdmin.

