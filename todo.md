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
