# Trail Scope - Implementation Plan

## Context

**Why**: Outdoor enthusiasts in Puerto Rico lack a centralized way to check trail conditions. Unpredictable tropical weather forces users to contact multiple social media groups for status updates, leading to last-minute cancellations and potential safety hazards.

**What**: Building Trail Scope, a mobile-first web app that enables community-powered trail condition reporting with real-time status updates (green/yellow/red system), QR code scanning at trailheads, trail search, and user authentication.

**Goal**: Create a complete, production-ready prototype for the Figma Config Makeathon design challenge - demonstrating UX depth and product thinking through a functional web application.

**Target**: Mobile-first design (375px primary → 768px tablet → 1280px desktop) with WCAG 2.1 AA accessibility compliance.

---

## Implementation Approach

### Technology Stack

**Frontend:**
- React 18.3.1 with TypeScript
- React Router 7.13.0 for navigation
- shadcn/ui components (45 pre-installed components based on Radix UI)
- Tailwind CSS v4 for styling
- React Hook Form 7.55.0 + Zod for form validation
- Sonner for toast notifications

**Backend & Data:**
- Supabase for PostgreSQL database, authentication, and real-time features
- @tanstack/react-query for server state management and caching

**QR Scanning:**
- @zxing/browser for camera-based QR code scanning in the browser
- HTML5 Media Devices API for camera access

**State Management:**
- React Context for auth state
- React Query for server state (trail data, reports)
- React Hook Form for form state

---

## Database Schema (Supabase)

### Tables

**`trails`**
```sql
- id (uuid, primary key)
- name (text, not null, unique)
- location (text)
- description (text)
- qr_code (text, unique) -- QR identifier for trailhead scanning
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())
```

**`trail_reports`**
```sql
- id (uuid, primary key)
- trail_id (uuid, foreign key -> trails.id, not null)
- user_id (uuid, foreign key -> auth.users.id, not null)
- status (text, not null) -- 'green', 'yellow', 'red'
- conditions (text[]) -- array: ['dry', 'muddy', 'downed-trees', etc.]
- notes (text, nullable)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())
```

**Indexes:**
- `trails(qr_code)` for fast QR lookups
- `trail_reports(trail_id, created_at DESC)` for feed queries
- `trail_reports(user_id)` for user report history

**Row Level Security:**
- `trails`: Public read, authenticated insert/update
- `trail_reports`: Public read, authenticated insert, own reports update/delete

---

## Route Structure

```
/ (Home/Feed)                    - Recent trail reports feed
/scan                            - QR code scanner interface
/search                          - Trail search interface
/trails/:trailId                 - Trail detail view with report history
/trails/:trailId/report          - Report submission form
/profile                         - User profile and report history
/auth/signin                     - Sign in page
/auth/signup                     - Sign up page
```

**Navigation:**
- Mobile (< 768px): Fixed bottom navigation bar (Home, Scan, Search, Profile)
- Desktop (≥ 768px): Top navigation bar

---

## Component Architecture

### Layout Components (to create)
- `src/app/components/layout/Layout.tsx` - Main layout wrapper with navigation
- `src/app/components/layout/BottomNav.tsx` - Mobile bottom navigation
- `src/app/components/layout/TopNav.tsx` - Desktop/tablet top navigation
- `src/app/components/layout/ProtectedRoute.tsx` - Auth guard wrapper

### Trail Components (to create)
- `src/app/components/trail/StatusBadge.tsx` - Accessible status indicator (icon + text + color)
  - Green: CheckCircle + "Safe" + green background
  - Yellow: AlertTriangle + "Caution" + yellow background
  - Red: XCircle + "Unsuitable" + red background
  - WCAG AA compliant - not relying on color alone

- `src/app/components/trail/TrailCard.tsx` - Display trail report in feed
  - Shows: trail name, status badge, condition tags, timestamp, reporter
  - Reuses: Card, StatusBadge, Badge (shadcn)

- `src/app/components/trail/ConditionTags.tsx` - Multi-select checkbox group
  - Options: dry, damp, muddy, downed-trees, rocky, other
  - Reuses: Checkbox, FormItem (shadcn)

- `src/app/components/trail/ReportForm.tsx` - Report submission form
  - Fields: status (radio group), conditions (checkboxes), notes (textarea)
  - React Hook Form + Zod validation
  - Reuses: Form, RadioGroup, Checkbox, Textarea, Button (shadcn)

### Scanner Components (to create)
- `src/app/components/scanner/QRScanner.tsx` - Camera-based QR scanner
  - Uses @zxing/browser for QR detection
  - Handles: camera permissions, scanning loop, success/error states
  - Fallback: Manual trail search if camera unavailable

### Search Components (to create)
- `src/app/components/search/TrailSearchCombobox.tsx` - Searchable trail selector
  - Reuses: Command component (cmdk) for fuzzy search
  - Full-screen dialog on mobile, popover on desktop

### Auth Components (to create)
- `src/app/components/auth/AuthForm.tsx` - Reusable sign in/sign up form
  - Supabase Auth integration
  - Reuses: Form, Input, Button, Alert (shadcn)

### Reusing shadcn/ui Components
All 45+ shadcn components are available in `src/app/components/ui/`. Key components to leverage:
- Card, Badge, Button, Form, Input, Textarea
- RadioGroup, Checkbox, Command
- Sheet/Drawer, Alert, Avatar, Skeleton

---

## Pages to Create

```
src/app/pages/
├── Home.tsx                     - Trail reports feed with filters
├── ScanPage.tsx                 - QR scanner with camera preview
├── SearchPage.tsx               - Trail search with combobox
├── TrailDetailPage.tsx          - Single trail view with report history
├── ReportPage.tsx               - Report submission form
├── ProfilePage.tsx              - User profile and submitted reports
└── auth/
    ├── SignInPage.tsx           - Sign in with email/password
    └── SignUpPage.tsx           - Sign up with email/password
```

---

## Core Infrastructure Files

### Supabase Setup
- `src/app/lib/supabase.ts` - Supabase client initialization and type exports
- `src/app/lib/schemas.ts` - Zod schemas for form validation
- `supabase/migrations/001_initial_schema.sql` - Database schema migration

### Routing
- `src/app/router.tsx` - React Router configuration with route definitions
- Update `src/app/App.tsx` - Wrap with RouterProvider and AuthContext

### State Management
- `src/app/contexts/AuthContext.tsx` - Auth state and Supabase auth listener
- `src/app/hooks/useTrailReports.ts` - React Query hook for reports feed
- `src/app/hooks/useTrail.ts` - React Query hook for single trail data
- `src/app/hooks/useAuth.ts` - Hook to consume AuthContext

### Styling
- Update `src/styles/theme.css` - Add status color tokens:
  ```css
  --status-green: oklch(0.65 0.15 145);
  --status-yellow: oklch(0.75 0.15 85);
  --status-red: oklch(0.55 0.22 25);
  ```

---

## Accessibility Strategy

**WCAG 2.1 AA Compliance:**

1. **Status Colors** - Not color alone:
   - Icon + Text + Color for each status
   - High contrast ratios (4.5:1 minimum)
   - ARIA labels on badges

2. **Touch Targets:**
   - Minimum 44x44px for mobile
   - Buttons: h-11 on mobile, h-9 on desktop

3. **Keyboard Navigation:**
   - Logical tab order through forms
   - Visible focus indicators on all interactive elements
   - Skip links for main navigation

4. **Screen Reader Support:**
   - Semantic HTML (nav, main, article)
   - Descriptive form labels
   - Live regions for dynamic updates

5. **Typography:**
   - Readable in bright sunlight (high contrast)
   - Scalable text (no fixed sizes)
   - Line height 1.5 for readability

---

## Mobile-First Responsive Strategy

**Breakpoints:**
- Base: 375px (mobile)
- md: 768px (tablet)
- lg: 1024px (desktop)
- xl: 1280px (large desktop)

**Key Patterns:**
- Navigation: Bottom bar (mobile) → Top bar (desktop)
- Layout: Single column (mobile) → Grid (desktop)
- Command: Full-screen dialog (mobile) → Popover (desktop)
- Typography: Base scale (mobile) → 1.125x scale (desktop)
- Touch targets: 44px+ (mobile) → 36px+ (desktop)

---

## Dependencies to Install

```bash
pnpm add @supabase/supabase-js @tanstack/react-query @zxing/browser zod @hookform/resolvers
```

**Package purposes:**
- `@supabase/supabase-js` - Supabase client for database and auth
- `@tanstack/react-query` - Server state management and caching
- `@zxing/browser` - QR code scanning in browser
- `zod` - Schema validation for forms
- `@hookform/resolvers` - Zod resolver for React Hook Form

---

## Implementation Sequence

### Phase 1: Foundation Setup
1. Install dependencies (Supabase, React Query, @zxing/browser, Zod)
2. Set up Supabase project and database schema
3. Create Supabase client configuration (`lib/supabase.ts`)
4. Set up AuthContext and authentication hooks
5. Configure React Router with route definitions
6. Create Layout components (BottomNav, TopNav, ProtectedRoute)
7. Update theme.css with status color tokens

### Phase 2: Core Trail Features
8. Build StatusBadge component with accessibility (icon + text + color)
9. Create TrailCard component for feed display
10. Implement Home page with trail reports feed using React Query
11. Build ReportForm component with validation (React Hook Form + Zod)
12. Create ReportPage with form submission and Supabase integration
13. Add Sonner toast notifications for feedback

### Phase 3: QR Scanner & Search
14. Implement QRScanner component using @zxing/browser
15. Create ScanPage with camera preview and permission handling
16. Build TrailSearchCombobox with Command component
17. Implement SearchPage with trail search
18. Create TrailDetailPage with single trail view and report history

### Phase 4: Authentication & Profile
19. Create AuthForm component with Supabase Auth methods
20. Build SignInPage and SignUpPage
21. Implement ProtectedRoute wrapper for authenticated pages
22. Create ProfilePage with user's submitted reports

### Phase 5: Polish & Optimization
23. Add loading states using Skeleton components
24. Implement error boundaries and error handling
25. Test dark mode functionality
26. Verify responsive design at all breakpoints
27. Run accessibility audit (keyboard nav, screen reader, contrast)
28. Performance optimization (code splitting, lazy loading QR scanner)

---

## Critical Files to Create/Modify

**Must Create (in order of priority):**

1. `src/app/lib/supabase.ts` - Supabase client setup
2. `src/app/contexts/AuthContext.tsx` - Authentication state
3. `src/app/router.tsx` - Route configuration
4. `src/app/components/layout/Layout.tsx` - Main layout wrapper
5. `src/app/components/layout/BottomNav.tsx` - Mobile navigation
6. `src/app/components/trail/StatusBadge.tsx` - Core status UI
7. `src/app/components/trail/TrailCard.tsx` - Report display
8. `src/app/components/trail/ReportForm.tsx` - Report submission
9. `src/app/components/scanner/QRScanner.tsx` - QR scanning
10. `src/app/pages/Home.tsx` - Main feed page
11. `src/app/pages/ScanPage.tsx` - Scanner page
12. `src/app/pages/ReportPage.tsx` - Report form page
13. `src/app/pages/auth/SignInPage.tsx` - Authentication
14. `supabase/migrations/001_initial_schema.sql` - Database schema

**Must Modify:**

1. `src/app/App.tsx` - Add RouterProvider and AuthContext wrapper
2. `src/styles/theme.css` - Add status color tokens (green/yellow/red)
3. `package.json` - Add new dependencies

---

## Verification Steps

### Functional Testing
- [ ] QR code scanning works on mobile device camera
- [ ] Trail search finds trails by name (fuzzy search)
- [ ] Report submission saves to Supabase database
- [ ] Feed displays recent reports ordered by date
- [ ] Auth flow works (sign up, sign in, sign out)
- [ ] Protected routes redirect unauthenticated users to sign in
- [ ] Status colors display correctly in light and dark mode

### Responsive Testing
- [ ] Test on 375px, 768px, 1280px viewports
- [ ] Bottom navigation appears only on mobile (< 768px)
- [ ] Top navigation appears on desktop (≥ 768px)
- [ ] Touch targets are 44px+ on mobile
- [ ] Text is legible and properly scaled at all breakpoints
- [ ] Grid layouts adapt from single to multi-column

### Accessibility Testing
- [ ] Keyboard navigation works through all interactive elements
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] Screen reader announces status with icon + text (not color alone)
- [ ] Color contrast meets WCAG AA (4.5:1) - use axe DevTools
- [ ] Focus indicators are visible on all interactive elements
- [ ] Form errors are announced and visible
- [ ] ARIA labels present on status badges and interactive elements

### Performance Testing
- [ ] Initial bundle size is reasonable (< 300KB gzipped)
- [ ] QR scanner loads lazily (code splitting)
- [ ] React Query caches API calls (no duplicate requests)
- [ ] Images use ImageWithFallback component
- [ ] No unnecessary re-renders (React DevTools Profiler)

### Cross-Browser Testing
- [ ] Works in Chrome, Firefox, Safari (desktop)
- [ ] Works in Chrome, Safari (mobile)
- [ ] Camera API works on iOS Safari and Android Chrome
- [ ] getUserMedia permission flow works correctly

### Database Testing
- [ ] Row Level Security prevents unauthorized access
- [ ] Reports link to correct trails and users via foreign keys
- [ ] QR code lookups are fast (indexed column)
- [ ] Real-time subscriptions work (if implemented)
- [ ] User can only edit/delete their own reports

### Edge Cases
- [ ] Camera permission denied - shows fallback to search
- [ ] No camera available - hides scanner, shows search only
- [ ] Invalid QR code - shows error message
- [ ] Network offline - appropriate error handling
- [ ] No reports in feed - shows empty state
- [ ] Form validation errors - displays inline and accessible

---

## Additional Considerations

### Security
- Rate limiting on report submissions (Supabase RLS or client-side throttling)
- Input sanitization for notes field (prevent XSS)
- Email verification for new accounts (Supabase Auth config)

### Future Enhancements (Post-MVP)
- Filter feed by status (green/yellow/red)
- Sort by trail name, date, popularity
- View all reports for a single trail (history timeline)
- Edit/delete own reports
- Supabase Realtime subscriptions for live feed updates
- Trail photos with reports (Supabase Storage)
- Geolocation to auto-detect nearby trails
- PWA manifest for "Add to Home Screen"
- Push notifications for trail status changes

### Design System Notes
- Project uses shadcn/ui components (Radix UI + Tailwind)
- All 45+ components are pre-installed in `src/app/components/ui/`
- Design tokens defined in `src/styles/theme.css` with dark mode support
- Button sizing: use `size="lg"` for mobile (h-10), default for desktop (h-9)
- Follow existing patterns: cva for variants, cn() for class merging

---

## Success Criteria

**Minimum Viable Product:**
1. Users can report trail conditions via QR scan or search
2. Reports display in a feed with status badges and condition tags
3. Authentication works for creating reports
4. Mobile-first responsive design (375px → 1280px)
5. WCAG 2.1 AA accessibility compliance
6. Real Supabase database with persistence
7. Camera-based QR scanning in browser

**Stretch Goals:**
- Realtime feed updates using Supabase subscriptions
- Trail detail page with report history
- User profile with submitted reports history
- Dark mode fully tested and polished
- PWA manifest for mobile app-like experience
