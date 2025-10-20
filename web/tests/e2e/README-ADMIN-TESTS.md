# Admin Area E2E Tests

## Overview

Comprehensive end-to-end tests for Feature 004 (Área Administrativa) covering:
- **T027**: Lesson Management (CRUD operations)
- **T039**: Responsive Design (mobile, tablet)
- **T040**: Security (admin vs non-admin access)

## Test Files

### 1. `lesson-management.spec.ts` (T027)
Tests all lesson and series management functionality:

**Test Cases:**
- Display lessons page with series and standalone lessons
- Create new series with initial lessons
- Edit series and reorder lessons (drag-and-drop)
- Create standalone lesson
- Edit existing lesson
- Delete lesson with confirmation dialog
- Loading states verification
- Navigation and breadcrumbs

**Coverage:**
- CRUD operations for lesson_series
- CRUD operations for lessons
- Soft delete functionality
- AlertDialog confirmations
- Toast notifications
- Form validation
- Series-lesson relationships

### 2. `admin-security.spec.ts` (T040)
Tests security boundaries between admin and non-admin users:

**Test Cases:**
- Block non-admin from `/admin`
- Block non-admin from `/admin/growth-groups`
- Block non-admin from `/admin/lessons`
- Block non-admin from `/admin/reports`
- Hide admin navigation links for non-admin
- Allow admin users to access admin area
- Maintain security across browser refresh
- Redirect to login if not authenticated
- Handle logout and prevent subsequent admin access

**Coverage:**
- Role-based access control
- Redirect logic
- Session persistence
- Navigation visibility
- Logout flow

### 3. `admin-responsive.spec.ts` (T039)
Tests responsive design across different viewport sizes:

**Test Cases:**
- Admin dashboard on mobile (375px)
- GC list on tablet (768px)
- Lesson form on mobile (375px)
- Reports with responsive charts (768px)
- Wizard steps on mobile
- Metric cards stacking vertically on mobile
- Tables with horizontal scroll on mobile
- Touch-friendly navigation elements

**Coverage:**
- Mobile (375px width)
- Tablet (768px width)
- Desktop (1280px width)
- Sidebar collapsibility
- Table scrollability
- Form readability
- Chart responsiveness
- Touch target sizes (44x44 minimum)

## Running the Tests

### Prerequisites

1. **Supabase Running**: Ensure local Supabase instance is up
   ```bash
   supabase start
   ```

2. **Test Users**: Create test users in the database
   ```sql
   -- Admin user
   INSERT INTO people (name, email) VALUES ('Admin Test', 'admin@exemplo.com');
   INSERT INTO users (person_id, is_admin) VALUES ('[person_id]', true);

   -- Regular user
   INSERT INTO people (name, email) VALUES ('User Test', 'user@exemplo.com');
   INSERT INTO users (person_id, is_admin) VALUES ('[person_id]', false);
   ```

3. **Set Passwords**: Use Supabase auth to set passwords
   ```bash
   # Via Supabase Studio or API
   ```

### Run All Tests
```bash
cd /Users/rafael/dev/carmelo-app/web
npx playwright test
```

### Run Specific Test Suite
```bash
# Lesson management
npx playwright test lesson-management.spec.ts

# Security
npx playwright test admin-security.spec.ts

# Responsiveness
npx playwright test admin-responsive.spec.ts
```

### Run on Specific Browser/Viewport
```bash
# Desktop Chrome
npx playwright test --project=chromium-desktop

# Mobile viewport
npx playwright test --project=chromium-mobile
```

### Debug Mode
```bash
npx playwright test --debug
```

### View Test Report
```bash
npx playwright show-report
```

## Test Data Requirements

### Minimum Data for Full Test Coverage:
- 1 admin user (is_admin = true)
- 1 regular user (is_admin = false)
- 3-5 Growth Groups with members
- 2 Lesson Series with 3+ lessons each
- 5 standalone lessons
- Sample meeting data
- Sample visitor data

### Recommended Test Data Setup:
```sql
-- Run seed script or manually create:
-- 1. People (10+)
-- 2. Users (5+, 1 admin)
-- 3. Growth Groups (5+)
-- 4. Participants (20+)
-- 5. Lesson Series (2+)
-- 6. Lessons (10+)
-- 7. Meetings (10+)
```

## Expected Results

### Successful Test Run:
- **Lesson Management**: 9 tests pass
- **Security**: 9 tests pass
- **Responsiveness**: 8 tests pass
- **Total**: 26 tests pass

### Common Failures:
1. **Authentication errors**: Missing test users or incorrect credentials
2. **Timeout errors**: Server not running or slow response
3. **Element not found**: UI changes not reflected in selectors
4. **Navigation errors**: Routing issues or redirects not working

## Troubleshooting

### Tests Timeout at Login
- Verify test user credentials exist in Supabase Auth
- Check if login form selectors match current implementation
- Ensure server is running (`npm run dev`)

### Tests Fail on Element Not Found
- Update selectors in test files
- Check if UI components were renamed
- Verify pages are rendering correctly

### Security Tests Fail
- Verify AdminLayout middleware is working
- Check RLS policies in Supabase
- Ensure session handling is correct

### Responsive Tests Fail
- Check if viewport resizing is working
- Verify Tailwind responsive classes are applied
- Ensure charts library supports responsive resizing

## Maintenance

### When to Update Tests:
- UI components are renamed or restructured
- New admin features are added
- Routing changes
- Form fields are modified
- Security logic is updated

### Test Coverage Expansion:
- Add tests for reports filtering
- Add tests for GC multiplication wizard
- Add tests for user management
- Add tests for configuration changes
- Add tests for error handling

## Integration with CI/CD

### GitHub Actions Example:
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx supabase start
      - run: npm run test:seed # Seed test data
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Notes

- Tests use `admin@exemplo.com` and `user@exemplo.com` as default credentials
- Update credentials in test files or use environment variables
- Tests assume default Supabase local setup (port 54321)
- Screenshots and videos are saved in `test-results/` on failure
- Tests run in parallel by default (can be adjusted in `playwright.config.ts`)

## Version

- **Created**: 2025-10-20
- **Feature**: 004-area-administrativa
- **Playwright**: ^1.40.0
- **Coverage**: T027, T039, T040 (manual test scenarios automated)
