# Follow-Ups CRM - Requirements Document

## 1. Overview

### 1.1 Purpose

A single-user CRM application designed for car salespeople to manage customer relationships, track vehicle purchases, and automate follow-up communications through customizable templates.

### 1.2 Current State

- **Backend**: Node.js/Express API with PostgreSQL database
- **Implemented Features**:
  - Customer CRUD operations (Create, Read)
  - Vehicle CRUD operations (Create, Read)
  - Customer-to-Vehicle relationships
  - Basic validation models
- **Missing Features**: Authentication, follow-up system, templates, user management

---

## 2. Authentication & Authorization

### 2.1 User Management

#### 2.1.1 Database Schema

**Table: `users`**

- `userId` (PRIMARY KEY, SERIAL)
- `email` (VARCHAR(255), UNIQUE, NOT NULL)
- `passwordHash` (VARCHAR(255), NOT NULL)
- `firstName` (VARCHAR(100), NOT NULL)
- `lastName` (VARCHAR(100), NOT NULL)
- `createdAt` (TIMESTAMP, DEFAULT NOW())
- `lastLogin` (TIMESTAMP)

#### 2.1.2 Authentication Endpoints

- `POST /api/auth/register`
  - Request: `{ email, password, firstName, lastName }`
  - Response: `{ userId, email, firstName, lastName, token }`
  - Validation: Email format, password strength (min 8 chars), unique email
- `POST /api/auth/login`
  - Request: `{ email, password }`
  - Response: `{ userId, email, firstName, lastName, token }`
  - Generate JWT token with 7-day expiration
- `POST /api/auth/logout`
  - Invalidate token (optional: maintain token blacklist)
- `GET /api/auth/me`
  - Requires: Authorization header with JWT
  - Response: `{ userId, email, firstName, lastName }`

#### 2.1.3 Password Security

- Use `bcrypt` for password hashing (salt rounds: 10)
- Never store plain-text passwords
- Implement password reset flow (future enhancement)

#### 2.1.4 JWT Implementation

- Use `jsonwebtoken` library
- Token payload: `{ userId, email, iat, exp }`
- Secret: Store in `.env` as `JWT_SECRET`
- Expiration: 7 days
- Middleware: `authenticateToken()` to protect all routes

### 2.2 Data Isolation

#### 2.2.1 Schema Updates

**Update existing tables:**

**`customers` table:**

- ADD `userId` (INTEGER, FOREIGN KEY → users.userId, NOT NULL)
- CREATE INDEX on `userId`

**`purchasedvehicles` table:**

- ADD `userId` (INTEGER, FOREIGN KEY → users.userId, NOT NULL)
- CREATE INDEX on `userId`

**`followuptemplates` table (new):**

- ADD `userId` (INTEGER, FOREIGN KEY → users.userId, NOT NULL)

**`followups` table (new):**

- ADD `userId` (INTEGER, FOREIGN KEY → users.userId, NOT NULL)

#### 2.2.2 Route Protection

All data routes must:

1. Require valid JWT token
2. Extract `userId` from token
3. Filter all queries by `userId`
4. Prevent cross-user data access

Example:

```javascript
// Protected route example
app.get("/api/customers", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // from JWT
  const result = await pool.query(
    "SELECT * FROM customers WHERE userId = $1 ORDER BY customerid",
    [userId],
  );
  // ...
});
```

---

## 3. Customer Management

### 3.1 Current Implementation

- ✅ `GET /api/customers` - List all customers
- ✅ `GET /api/customers/:id` - Get customer by ID
- ✅ `POST /api/customers` - Create customer

### 3.2 Required Updates

#### 3.2.1 Add userId to all operations

- Update all queries to include `WHERE userId = $1`
- Add `userId` to INSERT statements
- Validate ownership on GET by ID

#### 3.2.2 Additional Endpoints

- `PUT /api/customers/:id`
  - Update customer information
  - Validate ownership (userId match)
  - Full validation of updated fields
- `DELETE /api/customers/:id`
  - Soft delete preferred (add `isDeleted` boolean column)
  - Validate ownership
  - Consider cascade: what happens to vehicles and follow-ups?

#### 3.2.3 Enhanced Customer Model

Add optional fields:

- `email` (VARCHAR(255))
- `notes` (TEXT) - General notes about the customer
- `createdAt` (TIMESTAMP, DEFAULT NOW())
- `updatedAt` (TIMESTAMP)
- `lastContactDate` (DATE) - Last interaction date

---

## 4. Vehicle Management

### 4.1 Current Implementation

- ✅ `GET /api/vehicles` - List all vehicles
- ✅ `GET /api/customers/:id/vehicles` - Get vehicles for customer
- ✅ `POST /api/vehicles` - Create vehicle

### 4.2 Required Updates

#### 4.2.1 Add userId to all operations

- Update all queries to include `WHERE userId = $1`
- Add `userId` to INSERT statements

#### 4.2.2 Additional Endpoints

- `PUT /api/vehicles/:id`
  - Update vehicle information
  - Validate ownership
- `DELETE /api/vehicles/:id`
  - Soft delete preferred
  - Validate ownership

#### 4.2.3 Enhanced Vehicle Model

Add fields:

- `purchaseDate` (DATE) - Date vehicle was purchased
- `salePrice` (DECIMAL(10,2)) - Sale price
- `vin` (VARCHAR(17)) - Vehicle Identification Number
- `color` (VARCHAR(50))
- `mileage` (INTEGER)
- `notes` (TEXT)
- `createdAt` (TIMESTAMP, DEFAULT NOW())
- `updatedAt` (TIMESTAMP)

### 4.3 Purchase Status

Add `interactionType` field:

- `purchased` - Customer bought the vehicle
- `interested` - Customer showed interest, no purchase yet
- `test_drive` - Customer test drove
- `quote_provided` - Provided a quote

---

## 5. Follow-Up System

### 5.1 Interaction Types

Define interaction types that trigger follow-ups:

- Vehicle Purchase
- Vehicle Interest
- Test Drive
- General Inquiry

### 5.2 Database Schema

#### 5.2.1 Table: `interactions`

Track all customer interactions:

- `interactionId` (PRIMARY KEY, SERIAL)
- `userId` (INTEGER, FOREIGN KEY, NOT NULL)
- `customerId` (INTEGER, FOREIGN KEY, NOT NULL)
- `vehicleId` (INTEGER, FOREIGN KEY, NULLABLE) - If related to a vehicle
- `interactionType` (VARCHAR(50), NOT NULL) - 'purchase', 'interest', 'test_drive', etc.
- `interactionDate` (DATE, NOT NULL, DEFAULT CURRENT_DATE)
- `notes` (TEXT)
- `createdAt` (TIMESTAMP, DEFAULT NOW())

#### 5.2.2 Table: `followuptemplates`

User-customizable follow-up templates:

- `templateId` (PRIMARY KEY, SERIAL)
- `userId` (INTEGER, FOREIGN KEY, NOT NULL)
- `templateName` (VARCHAR(100), NOT NULL)
- `interactionType` (VARCHAR(50), NOT NULL) - Which interaction triggers this
- `daysAfter` (INTEGER, NOT NULL) - Days after interaction (30, 60, 90, etc.)
- `messageSubject` (VARCHAR(255))
- `messageBody` (TEXT, NOT NULL)
- `isActive` (BOOLEAN, DEFAULT TRUE)
- `createdAt` (TIMESTAMP, DEFAULT NOW())
- `updatedAt` (TIMESTAMP)

**Template Variables** (for dynamic content):

- `{{customerFirstName}}`
- `{{customerLastName}}`
- `{{customerPreferredName}}`
- `{{vehicleMake}}`
- `{{vehicleModel}}`
- `{{vehicleYear}}`
- `{{interactionDate}}`
- `{{daysElapsed}}`

#### 5.2.3 Table: `followups`

Generated follow-up tasks:

- `followupId` (PRIMARY KEY, SERIAL)
- `userId` (INTEGER, FOREIGN KEY, NOT NULL)
- `customerId` (INTEGER, FOREIGN KEY, NOT NULL)
- `interactionId` (INTEGER, FOREIGN KEY, NOT NULL)
- `templateId` (INTEGER, FOREIGN KEY, NOT NULL)
- `scheduledDate` (DATE, NOT NULL)
- `completedDate` (DATE, NULLABLE)
- `status` (VARCHAR(20), NOT NULL) - 'pending', 'completed', 'dismissed', 'snoozed'
- `messageSubject` (VARCHAR(255))
- `messageBody` (TEXT, NOT NULL) - Rendered template with actual values
- `notes` (TEXT) - User notes after completing follow-up
- `createdAt` (TIMESTAMP, DEFAULT NOW())

### 5.3 Follow-Up API Endpoints

#### 5.3.1 Interaction Endpoints

- `POST /api/interactions`
  - Create interaction and auto-generate follow-ups based on active templates
  - Request: `{ customerId, vehicleId?, interactionType, interactionDate, notes }`
  - Response: `{ interaction, generatedFollowups[] }`

- `GET /api/interactions`
  - List all interactions for logged-in user
  - Query params: `?customerId=X&interactionType=Y`

- `GET /api/interactions/:id`
  - Get specific interaction with related follow-ups

#### 5.3.2 Template Endpoints

- `GET /api/templates`
  - List all templates for logged-in user
  - Query params: `?interactionType=X&isActive=true`

- `GET /api/templates/:id`
  - Get specific template

- `POST /api/templates`
  - Create new template
  - Request: `{ templateName, interactionType, daysAfter, messageSubject, messageBody, isActive }`
  - Validation: daysAfter > 0, messageBody not empty

- `PUT /api/templates/:id`
  - Update template
  - Validate ownership

- `DELETE /api/templates/:id`
  - Delete template (soft delete preferred)
  - Validate ownership

- `GET /api/templates/variables`
  - Return list of available template variables
  - Response: `{ variables: [{ name, description, example }] }`

#### 5.3.3 Follow-Up Endpoints

- `GET /api/followups`
  - List follow-ups for logged-in user
  - Query params:
    - `?status=pending` (pending, completed, dismissed)
    - `?scheduledDateFrom=YYYY-MM-DD&scheduledDateTo=YYYY-MM-DD`
    - `?customerId=X`
  - Sort: Default by scheduledDate ASC
  - Include: Customer info, interaction details

- `GET /api/followups/:id`
  - Get specific follow-up with full details

- `PUT /api/followups/:id/complete`
  - Mark follow-up as completed
  - Request: `{ completedDate, notes }`
  - Set status to 'completed'

- `PUT /api/followups/:id/dismiss`
  - Mark follow-up as dismissed
  - Set status to 'dismissed'

- `PUT /api/followups/:id/snooze`
  - Snooze follow-up to future date
  - Request: `{ newScheduledDate }`
  - Set status to 'snoozed'

- `DELETE /api/followups/:id`
  - Delete a follow-up (validate ownership)

### 5.4 Follow-Up Generation Logic

When an interaction is created:

1. Query all active templates matching the interaction type for the user
2. For each template:
   - Calculate scheduledDate = interactionDate + template.daysAfter
   - Render template with actual customer/vehicle data
   - Insert into followups table with status='pending'

### 5.5 Template Rendering

Create utility function `renderTemplate(template, data)`:

```javascript
const renderTemplate = (template, data) => {
  let rendered = template;
  rendered = rendered.replace(
    /\{\{customerFirstName\}\}/g,
    data.customerFirstName || "",
  );
  rendered = rendered.replace(
    /\{\{customerLastName\}\}/g,
    data.customerLastName || "",
  );
  // ... replace all variables
  return rendered;
};
```

---

## 6. Frontend Routes & Screens

# Frontend Core Stack -

- "core": "React 18 + Vite",
- "routing": "React Router v6",
- "http": "Axios",
- "state": "Context API",
- "forms": "React Hook Form",
- "ui": "Material-UI",
- "dates": "date-fns"

### 6.1 Authentication Screens

#### 6.1.1 Login Screen (`/login`)

- Email input (required, email validation)
- Password input (required, password type)
- "Login" button
- "Register" link
- Error message display
- On success: Store JWT in localStorage, redirect to dashboard

#### 6.1.2 Register Screen (`/register`)

- Email input
- Password input (with strength indicator)
- Confirm password input
- First name input
- Last name input
- "Register" button
- "Login" link
- On success: Store JWT, redirect to dashboard

### 6.2 Main Application Screens

#### 6.2.1 Dashboard (`/` or `/dashboard`)

- Welcome message with user name
- Quick stats:
  - Total customers
  - Pending follow-ups count
  - Follow-ups due today
  - Follow-ups overdue
- Navigation to:
  - Customers list
  - Follow-ups list
  - Templates

#### 6.2.2 Customers List (`/customers`)

- Table/list of all customers
- Columns: Name, Phone, # of Vehicles, Last Contact, Actions
- Search/filter functionality
- "Add Customer" button
- Click customer → Navigate to customer detail

#### 6.2.3 Customer Detail (`/customers/:customerId`)

- Display customer information
- Edit button for customer info
- Section: Purchased Vehicles
  - List of vehicles
  - "Add Vehicle" button → Navigate to add vehicle screen
- Section: Interactions
  - List of interactions with this customer
  - "Add Interaction" button
- Section: Follow-Ups
  - List of pending/completed follow-ups for this customer
- Delete customer button (with confirmation)

#### 6.2.4 Add/Edit Customer (`/customers/new` or `/customers/:customerId/edit`)

- Form with all customer fields
- Validation feedback
- Save/Cancel buttons
- On save: Return to customer detail or list

#### 6.2.5 Add Vehicle (`/customers/:customerId/vehicle/new`)

- Form fields:
  - Make (required)
  - Model (required)
  - Year (required)
  - VIN
  - Color
  - Mileage
  - Purchase Date
  - Sale Price
  - Interaction Type (dropdown: purchased, interested, etc.)
  - Notes
- Save/Cancel buttons
- On save:
  - Create vehicle
  - Create interaction (if interaction type selected)
  - Generate follow-ups
  - Return to customer detail

#### 6.2.6 Edit Vehicle (`/vehicles/:vehicleId/edit`)

- Same form as add vehicle, pre-populated
- Update functionality

#### 6.2.7 Follow-Ups List (`/followups`)

- Filterable/sortable table:
  - Customer Name
  - Scheduled Date
  - Days After Interaction
  - Status
  - Message Preview
  - Actions
- Filter options:
  - Status (pending/completed/dismissed)
  - Date range
  - Customer
- Click follow-up → View detail modal
- Action buttons: Complete, Dismiss, Snooze

#### 6.2.8 Follow-Up Detail Modal

- Full customer info
- Original interaction details
- Complete rendered message
- Notes textarea
- Complete/Dismiss/Snooze buttons
- Edit button to modify message

#### 6.2.9 Templates List (`/templates`)

- List of all templates grouped by interaction type
- Each template shows:
  - Template name
  - Days after
  - Active/Inactive status
  - Edit/Delete buttons
- "Add Template" button

#### 6.2.10 Add/Edit Template (`/templates/new` or `/templates/:templateId/edit`)

- Form fields:
  - Template Name (required)
  - Interaction Type (dropdown, required)
  - Days After (number, required)
  - Message Subject
  - Message Body (textarea with template variable buttons, required)
  - Active toggle
- Template variable helper:
  - Buttons to insert variables at cursor
  - List of available variables with descriptions
- Preview pane showing rendered example
- Save/Cancel buttons

---

## 7. Security Requirements

### 7.1 Backend Security

- All routes except `/auth/register` and `/auth/login` require authentication
- Implement rate limiting on auth endpoints (5 attempts per 15 minutes)
- Sanitize all user inputs to prevent SQL injection
- Use parameterized queries only
- Validate JWT on every protected route
- Check user ownership on all data operations

### 7.2 Frontend Security

- Store JWT in localStorage (or httpOnly cookie for better security)
- Clear JWT on logout
- Redirect to login if JWT is expired/invalid
- Don't expose sensitive data in client-side code
- Implement CORS properly (whitelist frontend origin only)

### 7.3 Data Validation

- Backend validation on all inputs (never trust client)
- Frontend validation for UX
- Consistent error message format

---

## 8. Technical Implementation Guidelines

### 8.1 Backend Dependencies to Add

```json
{
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.0.2",
  "express-rate-limit": "^7.1.5"
}
```

### 8.2 Middleware to Implement

#### 8.2.1 Authentication Middleware

```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};
```

#### 8.2.2 User Context Middleware (after auth)

```javascript
const attachUserContext = (req, res, next) => {
  // Ensures userId is available in req.user
  if (!req.user || !req.user.userId) {
    return res.status(403).json({ error: "User context required" });
  }
  next();
};
```

### 8.3 Database Migration Steps

1. Create users table
2. Add userId to customers table
3. Add userId to purchasedvehicles table
4. Create interactions table
5. Create followuptemplates table
6. Create followups table
7. Create indexes for performance
8. Update foreign key constraints

### 8.4 Frontend Framework Recommendations

- React with React Router for routing
- Axios for API calls with JWT interceptor
- Context API or Redux for user state management
- Form library: React Hook Form or Formik
- UI library: Material-UI, Chakra UI, or Tailwind CSS

### 8.5 API Response Format Standards

#### Success Response:

```json
{
  "data": {
    /* response data */
  }
}
```

#### Error Response:

```json
{
  "error": "Error message",
  "errors": ["Validation error 1", "Validation error 2"]
}
```

---

## 9. Development Phases

### Phase 1: Authentication (Priority: CRITICAL)

- [ ] Create users table
- [ ] Implement registration endpoint
- [ ] Implement login endpoint
- [ ] Implement JWT generation and validation
- [ ] Create authentication middleware
- [ ] Add userId to existing tables
- [ ] Update all existing routes to filter by userId
- [ ] Create login/register screens
- [ ] Implement JWT storage and auth flow in frontend

### Phase 2: Enhanced Customer & Vehicle Management

- [ ] Add additional fields to customers table
- [ ] Add additional fields to purchasedvehicles table
- [ ] Implement update endpoints
- [ ] Implement delete endpoints
- [ ] Create/update frontend forms
- [ ] Implement customer detail screen
- [ ] Implement vehicle add/edit screens

### Phase 3: Interactions & Templates

- [ ] Create interactions table
- [ ] Create followuptemplates table
- [ ] Implement template CRUD endpoints
- [ ] Implement template rendering utility
- [ ] Create templates list screen
- [ ] Create template add/edit screen
- [ ] Implement interaction creation endpoint

### Phase 4: Follow-Up System

- [ ] Create followups table
- [ ] Implement follow-up generation logic
- [ ] Implement follow-up query endpoints
- [ ] Implement follow-up action endpoints (complete/dismiss/snooze)
- [ ] Create follow-ups list screen
- [ ] Create follow-up detail modal
- [ ] Integrate follow-up generation with vehicle purchase flow

### Phase 5: Dashboard & Polish

- [ ] Implement dashboard stats endpoints
- [ ] Create dashboard screen
- [ ] Add search/filter functionality
- [ ] Implement error handling and loading states
- [ ] Add confirmation dialogs for destructive actions
- [ ] Performance optimization
- [ ] Testing

---

## 10. Future Enhancements (Post-MVP)

### 10.1 Notifications

- Email integration for sending follow-ups
- SMS integration
- Browser notifications for due follow-ups
- Daily digest email

### 10.2 Reporting

- Sales analytics
- Follow-up completion rates
- Customer lifetime value
- Monthly/yearly reports

### 10.3 Calendar Integration

- Sync follow-ups with Google Calendar
- Appointment scheduling

### 10.4 Advanced Features

- Multi-user support (dealership mode)
- Team collaboration
- Lead scoring
- Document upload (contracts, photos)
- Mobile app

---

## 11. Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/followupscrm

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-here-use-strong-random-string
JWT_EXPIRATION=7d

# Optional (for future features)
EMAIL_SERVICE=
EMAIL_USER=
EMAIL_PASSWORD=
```

---

## 12. Testing Considerations

### 12.1 Backend Testing

- Unit tests for models and validation
- Integration tests for API endpoints
- Test data isolation (each user only sees their data)
- Test authentication flows
- Test follow-up generation logic

### 12.2 Frontend Testing

- Component tests
- Integration tests for flows
- E2E tests for critical paths (login → add customer → add vehicle → view follow-ups)

---

## 13. API Summary Reference

### Authentication

| Method | Endpoint           | Auth Required | Description       |
| ------ | ------------------ | ------------- | ----------------- |
| POST   | /api/auth/register | No            | Register new user |
| POST   | /api/auth/login    | No            | Login user        |
| POST   | /api/auth/logout   | Yes           | Logout user       |
| GET    | /api/auth/me       | Yes           | Get current user  |

### Customers

| Method | Endpoint           | Auth Required | Description     |
| ------ | ------------------ | ------------- | --------------- |
| GET    | /api/customers     | Yes           | List customers  |
| GET    | /api/customers/:id | Yes           | Get customer    |
| POST   | /api/customers     | Yes           | Create customer |
| PUT    | /api/customers/:id | Yes           | Update customer |
| DELETE | /api/customers/:id | Yes           | Delete customer |

### Vehicles

| Method | Endpoint                    | Auth Required | Description            |
| ------ | --------------------------- | ------------- | ---------------------- |
| GET    | /api/vehicles               | Yes           | List all vehicles      |
| GET    | /api/customers/:id/vehicles | Yes           | List customer vehicles |
| POST   | /api/vehicles               | Yes           | Create vehicle         |
| PUT    | /api/vehicles/:id           | Yes           | Update vehicle         |
| DELETE | /api/vehicles/:id           | Yes           | Delete vehicle         |

### Interactions

| Method | Endpoint              | Auth Required | Description        |
| ------ | --------------------- | ------------- | ------------------ |
| GET    | /api/interactions     | Yes           | List interactions  |
| GET    | /api/interactions/:id | Yes           | Get interaction    |
| POST   | /api/interactions     | Yes           | Create interaction |

### Templates

| Method | Endpoint                 | Auth Required | Description             |
| ------ | ------------------------ | ------------- | ----------------------- |
| GET    | /api/templates           | Yes           | List templates          |
| GET    | /api/templates/:id       | Yes           | Get template            |
| POST   | /api/templates           | Yes           | Create template         |
| PUT    | /api/templates/:id       | Yes           | Update template         |
| DELETE | /api/templates/:id       | Yes           | Delete template         |
| GET    | /api/templates/variables | Yes           | List template variables |

### Follow-Ups

| Method | Endpoint                    | Auth Required | Description       |
| ------ | --------------------------- | ------------- | ----------------- |
| GET    | /api/followups              | Yes           | List follow-ups   |
| GET    | /api/followups/:id          | Yes           | Get follow-up     |
| PUT    | /api/followups/:id/complete | Yes           | Mark complete     |
| PUT    | /api/followups/:id/dismiss  | Yes           | Dismiss follow-up |
| PUT    | /api/followups/:id/snooze   | Yes           | Snooze follow-up  |
| DELETE | /api/followups/:id          | Yes           | Delete follow-up  |

---

## 14. Data Model Summary

```
users (1) ──< (many) customers
users (1) ──< (many) purchasedvehicles
users (1) ──< (many) interactions
users (1) ──< (many) followuptemplates
users (1) ──< (many) followups

customers (1) ──< (many) purchasedvehicles
customers (1) ──< (many) interactions
customers (1) ──< (many) followups

interactions (1) ──< (many) followups
interactions (many) >── (1) purchasedvehicles (optional)

followuptemplates (1) ──< (many) followups
```

---

This requirements document provides a complete blueprint for implementing the Follow-Ups CRM application. Each section can be used by AI agents or developers to implement specific features while maintaining consistency with the overall architecture.
