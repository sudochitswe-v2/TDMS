# TDMS — Domain & Functional Project Specification

> **Companion Document Notice:** Do not duplicate or override the Vertical Slice folder structure, tech stack rules, JWT claim flattening mechanics, or generic IAM table definitions (`User`, `Role`, `UserRole`, `RoleClaim`) defined in `AGENTS.md`. This specification defines the **domain-specific resources, UI controls, MariaDB domain schema, matching algorithms, Vertical Slice feature requirements, and Dual-Layout SPA routing (`/*` vs `/admin/*`)** for the **Student-Tutor Discovery and Matching System (TDMS)**.

---

## 1. Domain Scope & Business Boundaries

TDMS is a centralized web application connecting **Parents** and **Students** with verified freelance **Tutors** through a consumer-facing web application layout (`/*`), supported by operational and system governance inside a single unified **Admin Dashboard Panel (`/admin/*`)**.

### 1.1 User Sub-Types & Seeded Default Roles
While authorization is enforced strictly via `{resource}:{action}` and `view:menu:{menu_name}` claims, `DatabaseSeedService.cs` must seed four default roles mapped to the domain actors:
1. **`ParentStudent` Role:** Shared by both **Parent** and **Student** accounts. During registration, users specify an `AccountSubType` (`'Parent'` or `'Student'`), which is stored on their learner profile while inheriting the exact same `ParentStudent` role claims.
2. **`Tutor` Role:** Assigned to freelance educators onboarding onto the platform.
3. **`OperationAdmin` Role:** Assigned to marketplace operators managing tutor verification, categories, subscriptions, and analytics inside `/admin/*`.
4. **`SystemAdmin` Role:** Seeded automatically with 100% of discovered `ResourceNames` and `UIControlNames` claims as mandated in `AGENTS.md`.

### 1.2 Explicit Out-of-Scope Guardrails (`Won't Have`)
Coding agents must **never** scaffold or implement:
* Video conferencing, WebRTC calls, or live interview scheduling (in-platform inquiry & text messaging only).
* Real payment gateway integrations (Stripe/PayPal); tutor subscriptions are managed strictly as informational tier records.
* Classroom, lesson, or homework management modules.
* Autonomous AI hiring (matching is strictly a deterministic rule-based compatibility calculation).

---

## 2. Concrete Constants for `Abstructions/` (`ResourceNames.cs` & `UIControlNames.cs`)

In accordance with `AGENTS.md`, register the following exact domain constants in `src/TDMS.Api/Abstructions/`.

### 2.1 `ResourceNames.cs` (API Policy Resources & Actions)

| Resource Constant | Value | Supported Actions (`{resource}:{action}`) |
| :--- | :--- | :--- |
| `Users` | `"users"` | `users:read`, `users:create`, `users:update`, `users:delete` |
| `Roles` | `"roles"` | `roles:read`, `roles:create`, `roles:update`, `roles:delete` |
| `Settings` | `"settings"` | `settings:read`, `settings:update`, `settings:maintain` |
| `LearnerProfiles` | `"learner_profiles"` | `learner_profiles:read`, `learner_profiles:create`, `learner_profiles:update` |
| `Tutors` | `"tutors"` | `tutors:read`, `tutors:create`, `tutors:update`, `tutors:verify` |
| `Categories` | `"categories"` | `categories:read`, `categories:create`, `categories:update`, `categories:delete` |
| `Subscriptions` | `"subscriptions"` | `subscriptions:read`, `subscriptions:create`, `subscriptions:update`, `subscriptions:select` |
| `Inquiries` | `"inquiries"` | `inquiries:read`, `inquiries:create`, `inquiries:respond` |
| `Messages` | `"messages"` | `messages:read`, `messages:create` |
| `Reviews` | `"reviews"` | `reviews:read`, `reviews:create`, `reviews:update`, `reviews:delete` |
| `Reports` | `"reports"` | `reports:read`, `reports:export` |

### 2.2 `UIControlNames.cs` (Navigation & Layout Claims)

| UI Control Constant | Claim Key (`ClaimType`) | Layout Context | Target Navigation / View |
| :--- | :--- | :--- | :--- |
| `NavLearnerAccount` | `"view:menu:learner_account"` | Main Web App (`/*`) | Top-Nav Account & Learning Requirements Page |
| `NavTutorStudio` | `"view:menu:tutor_workspace"` | Main Web App (`/*`) | Top-Nav Tutor Profile Studio, Schedule & Subscriptions |
| `NavMessages` | `"view:menu:messaging"` | Main Web App (`/*`) | Top-Nav Inquiries & Real-Time Chat Inbox |
| `NavMyReviews` | `"view:menu:feedback"` | Main Web App (`/*`) | Top-Nav Reviews & Tutor Ratings View |
| `AdminPanelAccess` | `"view:menu:admin_panel"` | Admin Panel (`/admin/*`) | Grants entry to the `/admin` Dashboard Layout & "Admin Panel" header button |
| `MenuOperations` | `"view:menu:operations"` | Admin Panel (`/admin/*`) | Sidebar: Tutor Verification, Categories & Subscription Packages |
| `MenuAnalytics` | `"view:menu:analytics"` | Admin Panel (`/admin/*`) | Sidebar: Activity Monitor, Category Demand/Supply & Operation Reports |
| `MenuAdministration` | `"view:menu:administration"` | Admin Panel (`/admin/*`) | Sidebar: User Accounts, Role/Claim Matrix, System Settings & DB Maintenance |

### 2.3 Default Role-Claim Seeding Matrix (`DatabaseSeedService.cs`)

| Role Name | Seeded `view:menu:*` Claims | Seeded `{resource}:{action}` Claims |
| :--- | :--- | :--- |
| **`ParentStudent`** | `view:menu:learner_account`, `view:menu:messaging`, `view:menu:feedback` | `tutors:read`, `categories:read`, `learner_profiles:read`, `learner_profiles:create`, `learner_profiles:update`, `inquiries:read`, `inquiries:create`, `messages:read`, `messages:create`, `reviews:read`, `reviews:create`, `reviews:update` |
| **`Tutor`** | `view:menu:tutor_workspace`, `view:menu:messaging`, `view:menu:feedback` | `tutors:read`, `tutors:create`, `tutors:update`, `categories:read`, `subscriptions:read`, `subscriptions:select`, `inquiries:read`, `inquiries:respond`, `messages:read`, `messages:create`, `reviews:read` |
| **`OperationAdmin`** | `view:menu:admin_panel`, `view:menu:operations`, `view:menu:analytics` | `tutors:read`, `tutors:verify`, `categories:read`, `categories:create`, `categories:update`, `categories:delete`, `subscriptions:read`, `subscriptions:create`, `subscriptions:update`, `reports:read`, `reports:export`, `reviews:read` |
| **`SystemAdmin`** | All `UIControlNames` (100% auto-discovered) | All `ResourceNames` actions (100% auto-discovered) |

---

## 3. Domain Database Schema (MariaDB & EF Core)

In addition to the core IAM tables (`Users`, `Roles`, `UserRoles`, `RoleClaims`) specified in `AGENTS.md`, `AppDbContext.cs` must configure the following normalized (3NF) MariaDB domain entities:

### 3.1 `LearnerProfiles` (1:1 with `Users`)
* `Id` (`CHAR(36)` PK)
* `UserId` (`CHAR(36)` FK $\rightarrow$ `Users.Id`, Unique)
* `AccountSubType` (`VARCHAR(20)` — `'Parent'` or `'Student'`)
* `GradeLevel` (`VARCHAR(50)`)
* `PreferredMaxHourlyFee` (`DECIMAL(10,2)`)
* `PreferredTeachingMode` (`VARCHAR(20)` — `'Online'`, `'InPerson'`, `'Both'`)
* `LearningGoalsNote` (`TEXT`)

### 3.2 `LearnerRequirementCategories` & `LearnerScheduleSlots` (1:N with `LearnerProfiles`)
* **`LearnerRequirementCategories`**: `Id` (PK), `LearnerProfileId` (FK), `CategoryId` (FK $\rightarrow$ `Categories.Id`).
* **`LearnerScheduleSlots`**: `Id` (PK), `LearnerProfileId` (FK), `DayOfWeek` (`TINYINT` 0–6), `StartTime` (`TIME`), `EndTime` (`TIME`).

### 3.3 `Categories` (System-Defined Subject Catalog)
* `Id` (`INT` PK, Auto-Increment)
* `Name` (`VARCHAR(100)`, Unique, Not Null)
* `Description` (`VARCHAR(500)`)
* `IsActive` (`BOOLEAN`, Default `true`)

### 3.4 `SubscriptionPackages` (Operational Tiers)
* `Id` (`INT` PK, Auto-Increment)
* `TierName` (`VARCHAR(80)`, Unique, Not Null)
* `DurationDays` (`INT`, Not Null)
* `DisplayFee` (`DECIMAL(10,2)`, Not Null — informational only)
* `MaxActiveSubjects` (`INT`, Not Null)
* `PrioritySearchBoost` (`INT`, Default `0`)
* `FeaturesJson` (`JSON`)
* `IsActive` (`BOOLEAN`, Default `true`)

### 3.5 `TutorProfiles` (1:1 with `Users`)
* `Id` (`CHAR(36)` PK)
* `UserId` (`CHAR(36)` FK $\rightarrow$ `Users.Id`, Unique)
* `Headline` (`VARCHAR(150)`)
* `Biography` (`TEXT`)
* `YearsOfExperience` (`INT`)
* `HourlyFee` (`DECIMAL(10,2)`)
* `TeachingMode` (`VARCHAR(20)` — `'Online'`, `'InPerson'`, `'Both'`)
* `LayoutThemeJson` (`JSON` — profile customization config)
* `VerificationStatus` (`VARCHAR(20)` — `'Pending'`, `'Verified'`, `'Rejected'`)
* `RejectionReason` (`VARCHAR(500)`, Nullable)
* `VerifiedByUserId` (`CHAR(36)`, Nullable FK $\rightarrow$ `Users.Id`)
* `VerifiedAt` (`DATETIME`, Nullable)
* `CurrentSubscriptionPackageId` (`INT`, Nullable FK $\rightarrow$ `SubscriptionPackages.Id`)
* `SubscriptionUpdatedAt` (`DATETIME`, Nullable)
* `AverageRating` (`DECIMAL(3,2)`, Default `0.00`)
* `TotalReviewsCount` (`INT`, Default `0`)
* `IsPublished` (`BOOLEAN`, Default `false`)

### 3.6 `TutorDocuments`, `TutorCategories` & `TutorScheduleSlots` (1:N with `TutorProfiles`)
* **`TutorDocuments`**: `Id` (PK), `TutorProfileId` (FK), `DocumentType` (`'IdentityID'`, `'AcademicCertificate'`), `FileUrl` (`VARCHAR(500)`), `UploadedAt` (`DATETIME`).
* **`TutorCategories`**: `Id` (PK), `TutorProfileId` (FK), `CategoryId` (FK $\rightarrow$ `Categories.Id`), `GradeLevelTarget` (`VARCHAR(50)`).
* **`TutorScheduleSlots`**: `Id` (PK), `TutorProfileId` (FK), `DayOfWeek` (`TINYINT` 0–6), `StartTime` (`TIME`), `EndTime` (`TIME`).

### 3.7 `Inquiries` (Relational Handshake & Firebase Thread Pointer)
* `Id` (`CHAR(36)` PK)
* `LearnerUserId` (`CHAR(36)` FK $\rightarrow$ `Users.Id`)
* `TutorProfileId` (`CHAR(36)` FK $\rightarrow$ `TutorProfiles.Id`)
* `CategoryId` (`INT` FK $\rightarrow$ `Categories.Id`)
* `InitialRequirementSummary` (`TEXT`, Not Null)
* `Status` (`VARCHAR(20)` — `'Pending'`, `'Accepted'`, `'Declined'`)
* `FirebaseThreadId` (`VARCHAR(128)`, Unique)
* `CreatedAt` (`DATETIME`), `RespondedAt` (`DATETIME`, Nullable)

### 3.8 `Reviews` (Student Feedback on Tutors)
* `Id` (`CHAR(36)` PK)
* `LearnerUserId` (`CHAR(36)` FK $\rightarrow$ `Users.Id`)
* `TutorProfileId` (`CHAR(36)` FK $\rightarrow$ `TutorProfiles.Id`)
* `StarRating` (`TINYINT` — constrained `1` to `5`)
* `Comment` (`TEXT`, Not Null)
* `CreatedAt` (`DATETIME`), `UpdatedAt` (`DATETIME`, Nullable)
* *Unique Constraint:* `(LearnerUserId, TutorProfileId)` so each learner maintains one editable review per tutor.

### 3.9 `SearchAuditLogs` & `SystemSettings`
* **`SearchAuditLogs`**: `Id` (PK), `CategoryId` (Nullable FK), `SearchedAt` (`DATETIME`), `LearnerUserId` (Nullable) — used to compute **Category Demand vs. Supply** (`U020`).
* **`SystemSettings`**: `Key` (`VARCHAR(100)` PK), `ValueJson` (`JSON`), `UpdatedAt` (`DATETIME`) — stores matching algorithm weights and platform parameters (`U025`).

---

## 4. Deterministic Matching Percentage Algorithm

When a user searches tutors (`GET /api/tutors/search`), the backend calculates a **Match Percentage ($0\%–100\%$)** comparing the learner's criteria against each `Verified` and `IsPublished` tutor using configurable weights from `SystemSettings` (defaulting to the formula below):

$$\text{MatchScore} = (W_{\text{subject}} \cdot S_{\text{subject}}) + (W_{\text{fee}} \cdot S_{\text{fee}}) + (W_{\text{schedule}} \cdot S_{\text{schedule}}) + (W_{\text{mode}} \cdot S_{\text{mode}})$$

1. **Subject Category Match ($W_{\text{subject}} = 40\%$):**
   * $S_{\text{subject}} = 1.0$ if the tutor teaches the requested `CategoryId` (or ratio of overlapping categories if multiple are selected); $0.0$ otherwise.
2. **Tuition Fee Compatibility ($W_{\text{fee}} = 25\%$):**
   * $S_{\text{fee}} = 1.0$ if `Tutor.HourlyFee <= Learner.PreferredMaxHourlyFee`.
   * If `Tutor.HourlyFee > PreferredMaxHourlyFee`, apply linear decay down to $0.0$ at $+50\%$ over budget:
     $$S_{\text{fee}} = \max\left(0, 1 - \frac{\text{HourlyFee} - \text{MaxFee}}{0.5 \times \text{MaxFee}}\right)$$
3. **Schedule Slot Overlap ($W_{\text{schedule}} = 25\%$):**
   * $S_{\text{schedule}} = \frac{\text{Number of overlapping (DayOfWeek, TimeRange) slots}}{\text{Total requested learner slots}}$ (or $1.0$ if no schedule filter is specified).
4. **Teaching Mode Match ($W_{\text{mode}} = 10\%$):**
   * $S_{\text{mode}} = 1.0$ if `Tutor.TeachingMode == Learner.PreferredTeachingMode` or either is `'Both'`; $0.0$ otherwise.

---

## 5. Vertical Slice Features & REST API Specification (`src/TDMS.Api/Features/`)

Organize `src/TDMS.Api/Features/` into the following self-contained vertical slices. Each slice contains its Command/Query handlers, FluentValidation validators, request/response DTOs, and Minimal API / Controller endpoints protected by `.RequireAuthorization("{resource}:{action}")`.

### 5.1 `Features/Auth/` & `Features/Account/`
* `POST /api/auth/register/learner` — Public. Registers a `Parent` or `Student` (`AccountSubType`), assigns `ParentStudent` role, and creates `LearnerProfile` (`U001`).
* `POST /api/auth/register/tutor` — Public. Registers a `Tutor` user, assigns `Tutor` role, creates `TutorProfile` (`VerificationStatus = 'Pending'`), and uploads onboarding documents (`U008`).
* `POST /api/auth/login` — Public. Validates credentials, flattens `RoleClaims` into the JWT payload per `AGENTS.md`, and returns token (`U000`).
* `GET /api/account/learner-profile` | `PUT /api/account/learner-profile` — Policy: `learner_profiles:read` / `learner_profiles:update`. Manages personal info, `AccountSubType`, preferred budget, subjects, and schedule slots (`U002`).

### 5.2 `Features/Tutors/` (Discovery, Profile Customization & Teaching Info)
* `GET /api/tutors/search` — Public (or optional JWT for personalized learner requirement matching). Multi-attribute filtering (`CategoryId`, `MinFee`, `MaxFee`, `DayOfWeek`, `TeachingMode`), logs search to `SearchAuditLogs`, computes **Match Percentage**, and returns ranked tutor cards (`U003`).
* `GET /api/tutors/{id}` — Public. Returns full tutor profile, credentials, schedule, and top reviews (`U004`, includes `U005`).
* `PUT /api/tutors/me/teaching-info` — Policy: `tutors:update`. Updates subjects (`TutorCategories`), hourly fees, teaching mode, and `TutorScheduleSlots` (`U010`).
* `PUT /api/tutors/me/customization` — Policy: `tutors:update`. Saves biography, headline, `LayoutThemeJson`, and supports preview/publish toggles (`U009`).

### 5.3 `Features/Inquiries/` & `Features/Messaging/` (Real-Time Firebase Integration)
* `POST /api/inquiries` — Policy: `inquiries:create`. Creates an `Inquiry` (`Status = 'Pending'`) from a Parent/Student to a Tutor (`U006`).
* `GET /api/inquiries` — Policy: `inquiries:read`. Lists inquiries for the current Learner or Tutor.
* `PUT /api/inquiries/{id}/respond` — Policy: `inquiries:respond`. Allows the Tutor to **Accept** or **Decline** an inquiry (`U012`).
  * When `Decision == "Accepted"`, the backend initializes `/threads/{firebaseThreadId}` in **Firebase Realtime Database** with participant IDs (`LearnerUserId`, `TutorUserId`) and unlocks messaging.
* `POST /api/messages/{inquiryId}` — Policy: `messages:create`. Validates that the caller is a participant of an `Accepted` inquiry and pushes/syncs message metadata with Firebase (`/threads/{firebaseThreadId}/messages`) (`U006`).

### 5.4 `Features/Reviews/` (Student Feedback & Tutor Ratings)
* `GET /api/tutors/{tutorId}/reviews` — Public / `reviews:read`. Lists historical reviews and aggregated star breakdown (`U005`, `U014`).
* `POST /api/tutors/{tutorId}/reviews` — Policy: `reviews:create`. Submits a new star rating (1–5) and comment, recalculates `TutorProfile.AverageRating`, and triggers a review notification for the tutor (`U007`, `U013`).
* `PUT /api/reviews/{reviewId}` — Policy: `reviews:update`. Updates the caller's existing review and recalculates `TutorProfile.AverageRating` (`U007`).

### 5.5 `Features/Operations/` (Verification, Categories, Subscriptions & Analytics)
* `GET /api/operations/tutors/pending` — Policy: `tutors:verify`. Lists tutors awaiting document verification.
* `PUT /api/operations/tutors/{tutorId}/verify` — Policy: `tutors:verify`. Approves (`VerificationStatus = 'Verified'`) or Rejects (`VerificationStatus = 'Rejected'` + `RejectionReason`) a tutor (`U015`).
* `GET /api/categories` (Public) | `POST`, `PUT`, `DELETE /api/categories/{id}` — Policy: `categories:create`, `categories:update`, `categories:delete`. Full CRUD on subject categories; blocks deletion if active `TutorCategories` reference the category (`U016`).
* `GET /api/subscriptions` (Public/`subscriptions:read`) | `POST`, `PUT /api/subscriptions/{id}` — Policy: `subscriptions:create`, `subscriptions:update`. Defines tutor subscription packages (`U017`).
* `POST /api/subscriptions/{packageId}/select` — Policy: `subscriptions:select`. Updates the authenticated tutor's `CurrentSubscriptionPackageId` without financial gateway processing (`U011`).
* `GET /api/operations/reports` — Policy: `reports:read`. Aggregates **Tutor and Student Activity Metrics** (`U019`) and **Category Demand vs. Supply Ratios** (`U020`) into a structured operational report (`U018`).

### 5.6 `Features/Administration/` (Accounts, RBAC/PBAC, Settings & DB Maintenance)
* `GET /api/admin/users` | `PUT /api/admin/users/{id}/status` — Policy: `users:read`, `users:update`. Lists user accounts, assigns roles, and activates/suspends users while preventing deactivation of the primary `SystemAdmin` (`U021`).
* `GET /api/admin/roles` | `POST /api/admin/roles` | `PUT /api/admin/roles/{id}/claims` — Policy: `roles:read`, `roles:create`, `roles:update`. Manages the Role-Permission Claim matrix (`U022`, `U023`).
* `GET /api/admin/system-data` — Policy: `settings:read`. Returns API request health, authentication audit logs, and MariaDB/Firebase connectivity status (`U024`).
* `GET /api/admin/settings` | `PUT /api/admin/settings` — Policy: `settings:update`. Updates global system parameters and matching algorithm weights (`W_subject`, `W_fee`, `W_schedule`, `W_mode` must sum to `100`) (`U025`).
* `POST /api/admin/database/maintenance` — Policy: `settings:maintain`. Runs relational integrity verification and database maintenance routines (`U026`).

---

## 6. Dual-Layout React SPA Architecture (`src/TDMS.Spa/`)

The React Router configuration in `src/TDMS.Spa/` must separate the UI into two distinct layout experiences: **1) Ordinary Web Application Layout (`/*`)** for Parents, Students, and Tutors, and **2) Unified Admin Dashboard Layout (`/admin/*`)** for Operation Admins and System Admins.

### 6.1 Layout 1: Ordinary Web Application Layout (`/*` — Consumer & Educator Facing)
Designed as a modern consumer web application with a clean **Top Navigation Bar**, hero section, card grids, and standard page containers (no admin sidebar).
* **Public & Discovery Routes:**
  * `/` — Landing page with subject category highlights and quick tutor search bar.
  * `/tutors` — Tutor Search & Filter directory displaying tutor cards and calculated **Match Percentage** badges (`U003`).
  * `/tutors/:id` — Detailed Tutor Profile page showing credentials, schedule availability, and student reviews (`U004`, `U005`), plus a "Send Inquiry" modal trigger (`U006`).
  * `/login`, `/register/learner`, `/register/tutor` — Authentication and onboarding flows (`U000`, `U001`, `U008`).
* **Authenticated Web App Routes (Top-Nav Items Gated by `<HasPermission>`):**
  * `/account` (`view:menu:learner_account`) — Parent/Student personal account settings, `AccountSubType` badge (`Parent` or `Student`), and learning requirement preferences (`U002`).
  * `/tutor-studio` (`view:menu:tutor_workspace`) — Tutor's personal web workspace with tabs for Teaching Info & Schedule (`U010`), Profile Customization & Live Preview (`U009`), and Subscription Plan selection cards (`U011`).
  * `/messages` (`view:menu:messaging`) — Split-pane web inbox where Learners send inquiries/messages (`U006`) and Tutors accept/decline inquiries (`U012`) and chat in real time via Firebase.
  * `/reviews` (`view:menu:feedback`) — Where Parents/Students manage their submitted feedback (`U007`) and Tutors view their received reviews and average star rating (`U013`, `U014`).
  * *Admin Switcher:* If the logged-in user possesses `view:menu:admin_panel`, display an **"Admin Panel"** button in the top-right user menu linking to `/admin`.

### 6.2 Layout 2: Unified Admin Dashboard Control Panel (`/admin/*`)
Designed as an executive back-office dashboard with a collapsible **Left Sidebar**, data tables, status badges, and analytics charts.
* **Route Guard:** Wrapping `<Route path="/admin/*" element={<RequirePermission permission="view:menu:admin_panel"><AdminDashboardLayout /></RequirePermission>} />` redirects unauthorized users (`ParentStudent` or `Tutor`) back to `/`.
* **Single Unified Admin Panel (Shared by `OperationAdmin` & `SystemAdmin` via Claims):**
  * `/admin` — Admin Overview summary cards.
  * **Operations Sidebar Group (`<HasPermission permission="view:menu:operations">`):**
    * `/admin/tutor-verifications` — Pending tutor onboarding review queue with document viewer and Approve/Reject actions (`tutors:verify`, `U015`).
    * `/admin/categories` — Subject category CRUD data table (`categories:create`, `categories:update`, `categories:delete`, `U016`).
    * `/admin/subscriptions` — Subscription package tier manager (`subscriptions:create`, `subscriptions:update`, `U017`).
  * **Analytics & Reports Sidebar Group (`<HasPermission permission="view:menu:analytics">`):**
    * `/admin/reports` — Tutor & Student Activity charts (`U019`), Category Demand vs. Supply ratio visualizer (`U020`), and Operation Report generator (`reports:read`, `reports:export`, `U018`).
  * **System Administration Sidebar Group (`<HasPermission permission="view:menu:administration">`):**
    * `/admin/users` — System user account table with role assignment and activate/suspend controls (`users:read`, `users:update`, `U021`).
    * `/admin/roles` — Interactive Role-Permission Claim matrix toggling `{resource}:{action}` and `view:menu:*` checkboxes (`roles:read`, `roles:create`, `roles:update`, `U022`, `U023`).
    * `/admin/settings` — Matching weight sliders (`W_subject`, `W_fee`, `W_schedule`, `W_mode`) and global parameters (`settings:update`, `U025`).
    * `/admin/system-health` — System data logs, API metrics (`settings:read`, `U024`), and MariaDB maintenance actions (`settings:maintain`, `U026`).