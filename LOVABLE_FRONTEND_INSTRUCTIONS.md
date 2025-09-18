# WireSafe Portal - Frontend Development Instructions

## Project Overview
WireSafe Portal is a secure wire fraud prevention platform for real estate transactions. It helps manage and monitor wire transfers between buyers, sellers, lenders, and escrow officers.

## Brand & Identity
- **Brand Name**: WireSafe Portal
- **Tagline**: "Secure wire fraud prevention for real estate transactions"
- **Purpose**: Manage real estate wire transfer transactions securely

## User Roles
- **Main Escrow Officer**: Can create transactions, add participants, manage everything
- **Secondary Escrow Officer**: Can approve banking information, verify transactions
- **Buyer**: Can submit banking information, complete verification steps
- **Seller**: Can verify banking info and confirm payments
- **Lender**: Can submit banking information, complete verification steps

## Transaction Statuses
- **Setup**: Initial transaction creation phase
- **Banking Info**: Waiting for banking information submission/approval
- **Buyer Verification**: Buyer verification and fund receipt confirmation
- **Seller Verification**: Seller identity verification and payment authorization
- **Completed**: Transaction successfully finished
- **Flagged**: Transaction flagged for review

---

# Pages and Components

## 1. Login Page (`/login`)

### Layout
- Clean, centered form on gray background
- Logo and branding at top
- Single column layout, mobile-responsive

### Text Content
- **Main Header**: "WireSafe Portal"
- **Page Title**: "Sign in to your account"
- **Subtitle**: "Secure wire fraud prevention for real estate transactions"
- **Form Fields**:
  - Username (placeholder: "Enter your username")
  - Password (placeholder: "Enter your password")
- **Button**: "Sign in" (loading state: "Signing in...")
- **Link**: "Don't have an account? Register here"
- **Error Messages**: Display authentication errors

### Functionality
- Username/password authentication
- Loading states during submission
- Error handling and display
- Redirect to dashboard on success
- Link to registration page

---

## 2. Registration Page (`/register`)

### Layout
- Similar to login page but with expanded form
- Two-column grid for name fields
- Checkbox group for roles
- Password requirements displayed

### Text Content
- **Main Header**: "WireSafe Portal"
- **Page Title**: "Create your account"
- **Subtitle**: "Join the secure wire fraud prevention platform"
- **Form Fields**:
  - First Name
  - Last Name
  - Username
  - Email Address
  - Phone Number
  - Company Name (Optional)
  - Roles (Select all that apply):
    - Buyer
    - Seller
    - Lender
    - Main Escrow Officer
    - Secondary Escrow Officer
  - Password
  - Confirm Password
- **Password Requirements**: "Must contain at least 12 characters with uppercase, lowercase, number, and special character (@$!%*?&)"
- **Button**: "Create account" (loading: "Creating account...")
- **Link**: "Already have an account? Sign in here"
- **Error Messages**: Validation and registration errors

### Functionality
- Multi-step form validation
- Role selection (multiple allowed)
- Password confirmation matching
- Account creation and auto-login
- Error handling for duplicate usernames/emails

---

## 3. Dashboard Page (`/dashboard`)

### Layout
- Grid-based layout with stats cards
- Welcome header with user name
- Quick actions section (for main escrow)
- Recent transactions list

### Text Content
- **Welcome Header**: "Welcome back, [First Name]"
- **Subtitle**: "Manage your real estate wire transfer transactions securely"

#### Stats Cards
- **Total Transactions**: Number with chart icon
- **In Progress**: Sum of active transactions with clock icon
- **Completed**: Number with checkmark icon
- **Flagged**: Number with warning icon

#### Quick Actions (Main Escrow Only)
- **Section Title**: "Quick Actions"
- **Buttons**:
  - "Create New Transaction" (with plus icon)
  - "View All Transactions" (with document icon)

#### Recent Transactions
- **Section Title**: "Recent Transactions"
- **View All Link**: "View all" (with arrow icon)
- **Loading State**: "Loading transactions..."
- **Empty State**: "No transactions found" / "Create your first transaction"
- **Error State**: Display error message
- **Transaction Items**:
  - Transaction ID (clickable link)
  - Status badge with color coding
  - Property address
  - Purchase amount (formatted as currency)
  - User role in transaction
  - "Action required" indicator

### Functionality
- Real-time transaction statistics
- Role-based quick actions
- Recent transactions preview (5 most recent)
- Direct navigation to transaction details
- Action item indicators

---

## 4. All Transactions Page (`/transactions`)

### Layout
- Header with title and new transaction button
- Full-width transaction list in card format
- Loading, error, and empty states

### Text Content
- **Page Title**: "All Transactions"
- **Subtitle**: "Manage and monitor all your real estate wire transfer transactions"
- **New Transaction Button**: "New Transaction" (main escrow only)
- **Loading State**: "Loading transactions..."
- **Error State**: Error message with retry option
- **Empty State**: "No transactions found" / "Create your first transaction"

#### Transaction Cards
- Transaction ID (prominent, clickable)
- Status badge (color-coded)
- Property address
- Purchase amount (currency formatted)
- Creation date
- User's role in transaction
- Action indicators

### Functionality
- Complete transaction listing
- Filterable/sortable transaction list
- Direct navigation to transaction details
- Role-based action buttons
- Status-based visual indicators

---

## 5. New Transaction Page (`/transactions/new`)

### Layout
- Form-based layout with clear sections
- Access control for non-main escrow users
- Step-by-step transaction creation

### Text Content
- **Page Title**: "Create New Transaction"
- **Subtitle**: "Set up a new real estate wire transfer transaction"
- **Access Denied** (non-main escrow):
  - **Title**: "Access Denied"
  - **Message**: "Only main escrow officers can create new transactions."

#### Form Fields
- **Property Address**: Text input for full property address
- **Purchase Amount**: Numeric input with currency formatting
- **Secondary Escrow Officer**: Username input for secondary escrow

### Form Sections
- **Transaction Details**: Property and amount information
- **Escrow Officers**: Secondary escrow assignment
- **Submit Button**: "Create Transaction" (loading: "Creating...")

### Functionality
- Form validation (required fields, amount formatting)
- Secondary escrow user lookup
- Transaction creation and redirect
- Error handling for invalid data
- Access control enforcement

---

## 6. Transaction Details Page (`/transactions/[id]`)

### Layout
- Header with transaction ID and status
- Two-column layout (main content + sidebar)
- Modal overlay for adding participants

### Text Content

#### Header Section
- Transaction ID (large, prominent)
- Status badge with creation date
- Back navigation to transactions list

#### Transaction Details Section
- **Section Title**: "Transaction Details" (with document icon)
- **Property Address**: Full address with location icon
- **Purchase Amount**: Currency formatted with dollar icon
- **Main Escrow Officer**: Name, username, avatar
- **Secondary Escrow Officer**: Name, username, avatar

#### Transaction Participants Section
- **Section Title**: "Transaction Participants" (with people icon)
- **Participant Cards**:
  - Avatar with initials
  - Full name and username
  - Role badge (Buyer, Seller, Lender, etc.)
  - Email address
  - Phone number
  - Company name (if applicable)
  - Date added

#### Sidebar - Quick Actions
- **Section Title**: "Quick Actions" (with lightning icon)
- **Buttons**:
  - "Add Participants"
  - "Update Status"
  - "View Documents"

#### Sidebar - Timeline
- **Section Title**: "Timeline" (with clock icon)
- **Events**:
  - "Transaction Created" with timestamp
  - "Last Updated" with timestamp (if different)

#### Add Participant Modal
- **Modal Title**: "Add Participant"
- **Form Fields**:
  - Username (with helper text: "The user must already be registered in the system")
  - Role dropdown (Buyer, Seller, Lender)
- **Buttons**: "Cancel" and "Add Participant"
- **Close button** (X icon)

### Functionality
- Real-time transaction data
- Participant management
- Status updates
- Document access
- Timeline tracking
- Modal interactions

---

## 7. Profile Page (`/profile`)

### Layout
- Two-step access: password verification then profile editing
- Form-based layout with edit/save modes
- Security-focused design

### Text Content

#### Password Verification (First Step)
- **Title**: "Verify Your Identity"
- **Subtitle**: "Please enter your password to access your profile"
- **Password Field**: "Current Password"
- **Button**: "Verify"
- **Error Messages**: Authentication errors

#### Profile Information
- **Section Title**: "Profile Information"
- **Edit Mode Toggle**: "Edit Profile" / "Cancel"
- **Form Fields**:
  - First Name
  - Last Name
  - Email Address
  - Phone Number
  - Company Name
  - Username (read-only)
  - Roles (display only)
- **Save Button**: "Save Changes"

### Functionality
- Two-factor profile access
- Secure password verification
- Profile data editing
- Form validation
- Save confirmation

---

## 8. Layout Component (Sidebar Navigation)

### Layout
- Fixed sidebar with navigation
- Mobile-responsive with hamburger menu
- User profile section in sidebar

### Text Content

#### Branding
- **Logo**: "WireSafe Portal" with lock icon

#### Navigation Menu
- **Dashboard** (with chart icon)
- **Transactions** (with document icon)
- **Profile** (with user icon)

#### User Profile Section
- User avatar with initials
- Full name
- Username/email
- User roles list
- **Logout button**: "Logout"

#### Mobile Header
- Hamburger menu icon
- User avatar and logout in top bar

### Functionality
- Responsive navigation
- Active page highlighting
- Mobile menu toggle
- User session management
- Role-based menu items

---

# Design Guidelines

## Color Scheme
- **Primary Blue**: #2563eb (buttons, links, accents)
- **Success Green**: #059669 (completed states)
- **Warning Yellow**: #d97706 (pending/in-progress)
- **Error Red**: #dc2626 (errors, flagged items)
- **Gray Scale**: Various grays for text, borders, backgrounds
- **Purple**: #7c3aed (verification states)
- **Orange**: #ea580c (seller verification)

## Status Color Coding
- **Setup**: Blue (#2563eb)
- **Banking Info**: Yellow (#d97706)
- **Buyer Verification**: Purple (#7c3aed)
- **Seller Verification**: Orange (#ea580c)
- **Completed**: Green (#059669)
- **Flagged**: Red (#dc2626)

## Typography
- Clean, professional fonts
- Clear hierarchy with proper font weights
- Readable body text with good contrast
- Bold headings for section titles

## Icons
- Consistent icon set throughout
- Functional icons for actions and states
- Status indicators and navigation icons
- User avatars with initials fallback

## Layout Principles
- Mobile-first responsive design
- Card-based layouts for content organization
- Grid systems for data display
- Consistent spacing and padding
- Clear visual hierarchy

---

# Interactive Elements

## Buttons
- Primary actions: Blue gradient with hover states
- Secondary actions: Gray with border and hover
- Destructive actions: Red for dangerous operations
- Loading states with spinners and text changes

## Forms
- Clear labeling and validation
- Real-time error display
- Required field indicators
- Helper text for complex fields
- Responsive form layouts

## Modals
- Overlay with backdrop
- Responsive sizing
- Clear close actions
- Form integration
- Escape key handling

## Status Indicators
- Color-coded badges
- Progress indicators
- Action required notifications
- Loading states with animations

---

# Error States and Messaging

## Error Types
- **Network Errors**: "Network error. Please try again."
- **Authentication**: "Invalid username or password"
- **Authorization**: "Access denied" / "Insufficient permissions"
- **Validation**: Field-specific error messages
- **Not Found**: "Transaction not found" / "Page not found"

## Loading States
- Spinner animations with descriptive text
- Button loading states
- Page-level loading indicators
- Skeleton loading for data

## Empty States
- Helpful messaging for empty data
- Action prompts for getting started
- Clear instructions for next steps

---

# Responsive Design

## Breakpoints
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

## Mobile Adaptations
- Collapsible sidebar navigation
- Stacked card layouts
- Touch-friendly button sizes
- Simplified data tables
- Modal sizing adjustments

## Accessibility
- Proper heading hierarchy
- Alt text for images
- Keyboard navigation support
- Color contrast compliance
- Screen reader compatibility

---

This comprehensive guide provides all the text content, layout specifications, and functionality requirements needed to create a beautiful, professional frontend for the WireSafe Portal application.