# SharedWallet

**SharedWallet** is a modern, mobile-first expense tracking application designed for couples to manage shared finances seamlessly. The application features real-time expense tracking, intelligent split calculations, workspace management, and an intuitive gesture-based interface optimized for mobile devices.

## Overview

SharedWallet provides couples with a comprehensive solution for tracking shared expenses, calculating settlements, and maintaining financial transparency. The application supports multiple workspaces, allowing users to separate different categories of expenses (e.g., household expenses, vacation budgets, or personal spending). Built with React, TypeScript, and a PostgreSQL database backend, SharedWallet combines localStorage persistence for offline functionality with database synchronization for multi-user collaboration.

## Core Features

### Expense Tracking

The primary expense tracking interface is located in **`client/src/pages/Home.tsx`**. This component serves as the main hub for all expense-related operations and includes the following capabilities:

**Add Expense Form**: Users can create new expenses by providing a description, amount, category, payer, and split method. The form supports three split types: 50/50 (equal split), income-based (proportional to each partner's income), and custom percentage splits. The form is accessible through the floating action button (FAB) on mobile or the "Add New Expense" card on desktop.

**Expense Categories**: The application organizes expenses into eight predefined categories, each with a distinct icon and color scheme:
- **Groceries** (Shopping Bag icon, emerald color)
- **Rent** (Home icon, blue color)
- **Utilities** (Zap icon, yellow color)
- **Fun** (Gamepad icon, pink color)
- **Gas** (Fuel icon, orange color)
- **Pet** (Paw Print icon, purple color)
- **Health** (Heart icon, red color)
- **Other** (Coffee icon, gray color)

**Settlement Calculation**: The settlement status card displays the current balance between partners. The calculation logic determines which partner owes money based on the cumulative expenses and chosen split methods. Settlement amounts update in real-time as expenses are added, edited, or deleted.

### Gesture-Based Interactions

SharedWallet implements intuitive swipe gestures for mobile users, providing quick access to common actions without cluttering the interface with buttons.

**Swipe to Delete** (Location: `client/src/pages/Home.tsx`, lines 838-843): Users can swipe an expense card to the left to reveal a delete action. The gesture requires either a swipe distance exceeding 60 pixels or a swipe velocity exceeding 300 pixels per second. When triggered, the system provides haptic feedback (if supported by the device) and displays a toast notification with an undo option.

**Swipe to Edit** (Location: `client/src/pages/Home.tsx`, lines 844-848): Swiping an expense card to the right opens the edit form with the expense details pre-populated. This gesture uses the same threshold values as the delete action (60 pixels distance or 300 pixels per second velocity) and provides haptic feedback upon activation.

**Implementation Details**: The swipe functionality is implemented using Framer Motion's drag API. Each expense card is wrapped in a `motion.div` with drag constraints and elastic behavior. The `onDragEnd` handler evaluates the swipe offset and velocity to determine which action to trigger. Visual feedback is provided through colored background layers (red for delete, indigo for edit) that appear behind the card during the swipe gesture.

### Undo Functionality

The undo system provides users with a safety net for accidental deletions. When an expense is deleted via swipe gesture or the delete button, a toast notification appears with an "Undo" action button. Clicking this button restores the deleted expense to its original position in the list. The undo functionality is implemented using the Sonner toast library with custom action handlers (Location: `client/src/pages/Home.tsx`, lines 473-483).

### Workspace Management

SharedWallet supports multiple workspaces, enabling users to maintain separate expense tracking environments for different purposes.

**Workspace Context** (Location: `client/src/contexts/WorkspaceContext.tsx`): The workspace context manages the current workspace selection and provides access to the list of workspaces the user belongs to. The selected workspace ID is persisted to localStorage, ensuring users return to their last active workspace when reopening the application.

**Workspace Switcher** (Location: `client/src/components/WorkspaceSwitcher.tsx`): The workspace switcher component appears in the application header, displaying the current workspace name, currency symbol, and total workspace count. On desktop, it renders as a dropdown button showing workspace details. On mobile, it appears as a compact button with the workspace initial and name. Clicking the switcher opens a dialog displaying all available workspaces with their details (name, currency, member information). Users can switch workspaces by clicking on any workspace card in the dialog.

**Database Schema** (Location: `drizzle/schema.ts`):
- **workspaces table**: Stores workspace metadata including name, owner ID, and currency symbol
- **workspaceMembers table**: Links users to workspaces with their partner designation (A or B), display name, avatar, and income
- **workspaceInvitations table**: Manages invitation codes for adding partners to workspaces

**API Endpoints** (Location: `server/workspace.router.ts`):
- `workspace.list`: Retrieves all workspaces the authenticated user belongs to
- `workspace.get`: Fetches detailed information for a specific workspace including all members
- `workspace.create`: Creates a new workspace and adds the creator as Partner A
- `workspace.update`: Modifies workspace settings (name, currency)
- `workspace.updateMember`: Updates member profile within a workspace
- `workspace.createInvitation`: Generates an invitation code for adding a partner
- `workspace.acceptInvitation`: Processes invitation acceptance and adds the user to the workspace

### Avatar System

SharedWallet integrates the DiceBear avatar library to provide customizable profile pictures for partners.

**Avatar Component** (Location: `client/src/components/DiceBearAvatar.tsx`): The avatar system supports twelve distinct styles including Adventurer, Avataaars, Big Smile, Robots, Fun Emoji, Lorelei, Micah, Mini Avatars, Notionists, Open Peeps, Personas, and Pixel Art. Each avatar is generated using a unique seed value, allowing users to customize their appearance while maintaining consistency across the application.

**Avatar Picker** (Location: `client/src/components/AvatarPicker.tsx`): The avatar picker interface allows users to select their preferred avatar style and customize the seed value. Users can manually enter a seed or click the randomize button to generate a new avatar. The picker displays a grid of available styles with preview thumbnails.

**Storage Format**: Avatars are stored in the database using the format `dicebear:style:seed`, enabling efficient parsing and regeneration of avatar URLs.

### Recurring Expenses

The recurring expenses feature automates the addition of regular bills and subscriptions.

**Recurring Expense Management** (Location: `client/src/pages/Home.tsx`, recurring expense section): Users can set up recurring expenses by specifying the description, amount, category, frequency (weekly or monthly), and next due date. The system automatically checks for due recurring expenses on application load and adds them to the expense list when their due date arrives.

**Automatic Processing** (Location: `client/src/pages/Home.tsx`, lines 345-407): The recurring expense checker runs on component mount and evaluates each recurring expense against the current date. When a recurring expense is due, the system creates a new expense entry, generates a notification, sends a push notification (if enabled), and updates the next due date based on the frequency setting.

### Budget Tracking

Budget tracking enables users to set spending limits for each expense category and monitor their progress.

**Budget Interface** (Location: `client/src/pages/Home.tsx`, budget dialog): The budget management dialog displays all expense categories with input fields for setting budget amounts. The insights section shows visual progress bars indicating spending relative to budget limits, with color-coded warnings when approaching or exceeding budgets.

**Budget Calculation**: Budget progress is calculated by summing all expenses in each category and comparing the total to the set budget limit. Categories without budget limits are excluded from the budget tracking visualization.

### Push Notifications

SharedWallet supports browser push notifications for bill reminders and recurring expense alerts.

**Notification System** (Location: `client/src/pages/Home.tsx`, notification functions): The push notification system requests permission from the user and sends notifications when recurring expenses are automatically added. Notifications display the expense description, amount, and currency symbol. The notification permission state is stored in localStorage to avoid repeated permission requests.

**Notification Management**: Users can enable or disable push notifications through the settings dialog. The application checks for notification support before requesting permission and provides fallback behavior for browsers that do not support the Notification API.

### Theme System

SharedWallet implements a dark mode toggle for improved visibility in different lighting conditions.

**Theme Context** (Location: `client/src/contexts/ThemeContext.tsx`): The theme context manages the current theme state (light or dark) and provides a toggle function for switching between themes. The selected theme is persisted to localStorage and applied to the document root element via a CSS class.

**Theme Toggle**: On desktop, the theme toggle button appears in the application header as a sun/moon icon. On mobile, the theme toggle is accessible through the settings menu to reduce header clutter.

### Security Features

The application includes a PIN lock feature for protecting sensitive financial data.

**Security Context** (Location: `client/src/contexts/SecurityContext.tsx`): The security context manages PIN creation, verification, and removal. When a PIN is set, users must enter it correctly before accessing the application. The PIN is stored in localStorage using a simple hash for basic protection.

**PIN Lock Screen**: When a PIN is active, the application displays a lock screen overlay requiring PIN entry before revealing expense data. Users can remove the PIN through the security settings panel.

## Mobile-First Design

SharedWallet prioritizes mobile user experience with responsive layouts, touch-optimized controls, and gesture-based interactions.

**Header Optimization**: On mobile devices (screens smaller than 768px), the application header displays only the SharedWallet logo, workspace switcher, and settings icon. Notifications and theme toggle are hidden on mobile to reduce visual clutter and provide more space for the workspace switcher. These features remain accessible through the settings menu.

**Floating Action Button**: The mobile interface features a floating action button (FAB) in the bottom-right corner for quick access to the expense creation form. The FAB uses a gradient background matching the application's color scheme and includes a plus icon for clear affordance.

**Bottom Navigation**: Mobile users navigate between different sections (Home, Insights, Planning, Menu) using a fixed bottom tab bar. The tab bar includes icons and labels for each section, with the active tab highlighted using the primary color.

**Touch Targets**: All interactive elements maintain a minimum touch target size of 44x44 pixels, following accessibility guidelines for mobile interfaces. Buttons and cards include adequate padding to prevent accidental taps.

## Data Persistence

SharedWallet employs a hybrid data persistence strategy combining localStorage for offline functionality and PostgreSQL database for multi-user synchronization.

**LocalStorage Strategy**: Expense data, user profiles, budgets, recurring expenses, and notifications are stored in localStorage using JSON serialization. This approach enables offline functionality and instant data access without network requests. LocalStorage keys include `expenses`, `profiles`, `budgets`, `recurringExpenses`, `notifications`, `defaultSplitType`, `defaultCustomSplitA`, and `currency`.

**Database Integration**: The application includes a complete database schema and tRPC API for multi-user collaboration. When database sync is enabled, expenses are stored in the `expenses` table with workspace association, allowing multiple users to view and manage shared expenses in real-time.

**Migration Path**: The current implementation uses localStorage as the primary data store, with database infrastructure ready for activation. Future updates will migrate expense data from localStorage to the database while maintaining backward compatibility.

## Technology Stack

SharedWallet is built using modern web technologies optimized for performance and developer experience:

- **Frontend Framework**: React 19 with TypeScript for type-safe component development
- **Build Tool**: Vite for fast development builds and optimized production bundles
- **Styling**: Tailwind CSS 4 for utility-first styling with custom design tokens
- **UI Components**: Shadcn/ui component library for consistent, accessible interface elements
- **Animation**: Framer Motion for smooth transitions and gesture-based interactions
- **Icons**: Lucide React for a comprehensive icon set with consistent styling
- **Charts**: Recharts for data visualization in the insights section
- **Backend**: Express 4 with tRPC 11 for type-safe API communication
- **Database**: PostgreSQL with Drizzle ORM for schema management and queries
- **Authentication**: Manus OAuth for secure user authentication

## File Structure

The project follows a modular architecture with clear separation of concerns:

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── WorkspaceSwitcher.tsx
│   │   ├── DiceBearAvatar.tsx
│   │   ├── AvatarPicker.tsx
│   │   └── ProfileAvatar.tsx
│   ├── contexts/            # React context providers
│   │   ├── WorkspaceContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── SecurityContext.tsx
│   ├── pages/               # Page-level components
│   │   └── Home.tsx         # Main expense tracking interface
│   └── lib/                 # Utility functions and configurations
│       └── trpc.ts          # tRPC client setup
server/
├── workspace.router.ts      # Workspace API endpoints
├── db.ts                    # Database query helpers
└── routers.ts              # Main tRPC router configuration
drizzle/
└── schema.ts               # Database schema definitions
```

## Testing

SharedWallet includes comprehensive unit tests for critical functionality:

**Workspace Switching Tests** (Location: `server/workspace.switching.test.ts`): The test suite validates workspace listing, workspace details retrieval, member information accuracy, and multi-workspace membership support. All tests use the Vitest framework with database fixtures for consistent test data.

**Test Execution**: Run tests using the command `pnpm test` from the project root directory. The test suite includes setup and teardown logic to ensure test isolation and prevent data contamination between test runs.

## Future Enhancements

SharedWallet's architecture supports several planned enhancements:

**Database Migration**: Transition from localStorage to full database persistence for all expense data, enabling real-time synchronization between partners and persistent data storage across devices.

**Invitation System**: Activate the existing invitation infrastructure to allow users to invite partners via unique invitation codes, supporting true multi-user collaboration within workspaces.

**Export Functionality**: Implement CSV and PDF export for expense reports, enabling users to generate financial summaries for tax purposes or personal record-keeping.

**Analytics Dashboard**: Expand the insights section with advanced analytics including spending trends over time, category comparisons, and predictive budget alerts.

**Mobile Application**: Package the web application as a native mobile app using Capacitor, providing offline functionality, push notifications, and native device integration.

---

**Author**: Manus AI  
**Last Updated**: January 2026  
**License**: Proprietary
