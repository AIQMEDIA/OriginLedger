# Role Permission Testing Guide

## OriginLedger Role-Based Access Control Demo

### Available Test Users
Based on the current system, here are the users you can test with:

1. **AcmeCorp (manufacturer)**
   - Username: `AcmeCorp`
   - Password: `demo123`
   - **Permissions:**
     ✅ Dashboard, Assets, Blockchain, Participants (public)
     ✅ Events Management (create/view events)
     ✅ Asset Creation (add new assets)
     ✅ Audit Trail Access (compliance data)
     ✅ Chain Validation (blockchain integrity)
     ✅ API Testing (developer tools)

2. **GlobalLogistics (shipper)**
   - Username: `GlobalLogistics`
   - Password: `demo123`
   - **Permissions:**
     ✅ Dashboard, Assets, Blockchain, Participants (public)
     ✅ Events Management (shipping events)
     ❌ Asset Creation (manufacturers only)
     ❌ Audit Trail Access (restricted)
     ❌ Chain Validation (restricted)
     ❌ API Testing (restricted)

3. **RetailChain (retailer)**
   - Username: `RetailChain`
   - Password: `demo123`
   - **Permissions:**
     ✅ Dashboard, Assets, Blockchain, Participants (public)
     ✅ Events Management (retail/delivery events)
     ❌ Asset Creation (manufacturers only)
     ❌ Audit Trail Access (restricted)
     ❌ Chain Validation (restricted)
     ❌ API Testing (restricted)

## How to Test Role Permissions

### Step 1: Navigate to Role Demo Page
Visit `/role-demo` to see the complete permission matrix and role descriptions.

### Step 2: Sign In with Different Roles
1. Click "Sign In" in the navigation
2. Use one of the test accounts above
3. Notice how the navigation changes based on role

### Step 3: Test Protected Features
Try accessing these features with different roles:

- **Events** (`/events`) - Only manufacturers, shippers, retailers
- **Audit Trail** (`/audit`) - Only manufacturers and admin roles  
- **API Testing** (`/testing`) - Only manufacturers and admin roles

### Step 4: Observe Navigation Changes
Notice how the navigation shows different action buttons:
- **Manufacturers**: See "Add Asset", "Add Event", "Validate Chain"
- **Shippers**: See "Add Event" only
- **Retailers**: See "Add Event" only

### Step 5: Profile Management
Access `/profile` when logged in to see:
- User information with role badge
- Security settings
- Password change functionality

## Expected Behavior

### ✅ When Authorized:
- Feature loads normally
- All functionality is available
- Role-specific action buttons appear

### ❌ When Unauthorized:
- Shows "Access Restricted" message
- Explains required roles
- Provides "Go Back" option

### 🔒 When Not Authenticated:
- Shows "Authentication Required" message
- Prompts to sign in
- Redirects to login modal

## Technical Implementation

The system uses:
1. **JWT Authentication** - Secure token-based auth
2. **Role Guards** - Component-level access control
3. **Dynamic Navigation** - Role-based menu items
4. **Middleware Protection** - Server-side route protection
5. **Fallback UI** - User-friendly error states