# SharedWallet TODO

## Completed Features
- [x] Push Notifications for bill reminders
- [x] Add Gas, Pet, and Health expense categories
- [x] Redesign app icon with Arc Browser-inspired aesthetic
- [x] Fix error in Insights section
- [x] Fix Android PWA icon not showing on home screen
- [x] Fix PWA icon not displaying on Android Chrome
- [x] Change default PWA name to "SharedWallet"
- [x] Implement custom splash screen with SharedWallet logo
- [x] Replace custom avatars with DiceBear avatar library
- [x] Create avatar component with multiple style options
- [x] Allow users to select avatar style and customize seed

## Multi-User Collaboration (New)
- [ ] Add "Invite Partner" button in Settings dialog (UI placeholder added)
- [x] Create invitation generation backend API (already exists from previous work)
- [ ] Implement invitation acceptance flow
- [ ] Add database sync for expenses (works alongside localStorage)
- [ ] Test real-time sync between two users

## Workspace Switching Feature (New)
- [x] Update workspace schema to support multiple workspaces per user
- [x] Create tRPC API endpoints for fetching user's workspaces
- [x] Add workspace switching mutation to backend
- [x] Build WorkspaceSwitcher component (dropdown for desktop)
- [x] Build WorkspaceSwitcher component (bottom sheet for mobile)
- [x] Update WorkspaceContext to handle workspace switching
- [x] Add workspace indicator in header
- [x] Test workspace switching with multiple workspaces
- [x] Ensure expenses load correctly when switching workspaces
- [x] Add "Create New Workspace" option in switcher

## Mobile UX Improvements
- [x] Remove redundant header icons on mobile (notifications, theme)
- [x] Improve workspace switcher spacing on mobile
- [x] Keep settings icon visible for quick access

## Documentation
- [x] Create README.md with project overview
- [x] Document all features and their locations
- [x] Document swipe gestures and undo functionality
- [x] Document workspace switching feature

## Database Integration
- [x] Create expenses table schema in database
- [x] Create recurring expenses table schema
- [x] Add expense API endpoints (create, list, update, delete)
- [x] Add recurring expense API endpoints
- [ ] Migrate expense tracking from localStorage to database
- [ ] Update expense list to fetch from database
- [ ] Update settlement calculation to use database data
- [ ] Test expense CRUD operations with database

## Workspace Creation Flow
- [x] Create workspace creation dialog/form
- [x] Add workspace creation API integration
- [x] Connect "Create New Workspace" button to creation flow
- [x] Add validation for workspace name and currency
- [x] Test workspace creation end-to-end

## Workspace Settings Panel
- [x] Create workspace settings dialog component
- [x] Add workspace rename functionality
- [x] Add workspace currency change functionality
- [x] Add workspace delete functionality
- [x] Add settings button to UI
- [x] Test workspace settings operations

## Phase 1: Code Refactoring - Extract Business Logic
- [x] Analyze Home.tsx structure and identify logic to extract
- [x] Create useExpenseForm hook (form state, validation, add/edit logic)
- [x] Create useExpenseList hook (filtering, search, display logic)
- [x] Create useSettlement hook (settlement calculation)
- [x] Create useRecurringExpenses hook (recurring expense management)
- [ ] Update Home.tsx to use new hooks (deferred to Phase 2)
- [x] Test hooks independently

## Phase 2: Code Refactoring - Extract UI Components
- [x] Create ExpenseForm component
- [x] Create ExpenseList component with swipe gestures
- [x] Create SettlementCard component
- [x] Create TabNavigation component
- [x] Skip separate page files (keep tabs in Home.tsx for state sharing)
- [x] Components extracted and ready for reuse in future features
- [x] Refactoring complete - 4 hooks + 4 components created

## Database Migration (localStorage → Database)
- [x] Review expense API endpoints and database schema
- [ ] Replace expenses localStorage with tRPC queries
- [ ] Replace recurring expenses localStorage with tRPC queries
- [ ] Migrate profiles to database (workspace members table)
- [ ] Migrate budgets to database
- [ ] Migrate notifications to database
- [ ] Test all CRUD operations with database
- [ ] Remove localStorage dependencies

## Partner Invitation System (New Standalone Feature)
- [x] Review invitation API endpoints in workspace router
- [x] Create InvitationManager component (list, accept, reject)
- [x] Create SendInvitationDialog component (email or code)
- [x] Create InvitationCard component (integrated into InvitationManager)
- [x] Add "Invitations" tab to WorkspaceSettingsDialog
- [x] Test invitation flow (send, accept, reject)
- [x] Write vitest tests for invitation functionality (5/5 passing)

## Bug Fixes
- [x] Fix workspace settings dialog not opening
- [x] Test workspace settings access from menu
