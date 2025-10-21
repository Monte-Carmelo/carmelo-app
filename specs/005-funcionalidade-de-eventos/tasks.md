---
description: "Task list for Sistema de Eventos implementation"
---

# Tasks: Sistema de Eventos

**Input**: Design documents from `/specs/005-funcionalidade-de-eventos/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3...)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `web/src/`, `web/tests/` at repository root
- Paths shown below assume web app structure based on plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create migration file for events table in supabase/migrations/YYYYMMDDHHMMSS_create_events_table.sql
- [ ] T002 Apply migration and regenerate types in web/src/lib/supabase/database.types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Create Supabase Storage bucket `event-banners` with RLS policies
- [ ] T004 [P] Create Zod validation schemas in web/src/lib/validations/event.ts
- [ ] T005 [P] Create Server Actions for CRUD operations in web/src/app/(app)/admin/events/actions.ts
- [ ] T006 [P] Create Server Actions for image upload in web/src/app/(app)/admin/events/storage-actions.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Admin Event Management (Priority: P1) 🎯 MVP

**Goal**: Administrators can create, edit, and delete events with banner images

**Independent Test**: Admin can create event with image, edit it, and delete it - all operations persist correctly

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T007 [P] [US1] E2E test for admin creates event with banner in web/tests/e2e/events.spec.ts
- [ ] T008 [P] [US1] E2E test for admin edits event in web/tests/e2e/events.spec.ts
- [ ] T009 [P] [US1] E2E test for admin deletes event in web/tests/e2e/events.spec.ts

### Implementation for User Story 1

- [ ] T010 [P] [US1] Create AdminEventList component in web/src/components/admin/AdminEventList.tsx
- [ ] T011 [P] [US1] Create AdminEventForm component in web/src/components/admin/AdminEventForm.tsx
- [ ] T012 [US1] Implement admin events list page in web/src/app/(app)/admin/events/page.tsx (depends on T010)
- [ ] T013 [US1] Implement create event page in web/src/app/(app)/admin/events/new/page.tsx (depends on T011)
- [ ] T014 [US1] Implement edit event page in web/src/app/(app)/admin/events/[id]/edit/page.tsx (depends on T011)
- [ ] T015 [US1] Implement event details admin page in web/src/app/(app)/admin/events/[id]/page.tsx
- [ ] T016 [US1] Update AdminSidebar to include Events link in web/src/components/admin/AdminSidebar.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Public Event Viewing (Priority: P2)

**Goal**: Regular users can view events with filtering and navigation

**Independent Test**: User can view future events, navigate between years, filter events, and see event details

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T017 [P] [US2] E2E test for user views events list in web/tests/e2e/events.spec.ts
- [ ] T018 [P] [US2] E2E test for user views event details in web/tests/e2e/events.spec.ts
- [ ] T019 [P] [US2] E2E test for user navigates between years in web/tests/e2e/events.spec.ts

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create EventCard component in web/src/components/events/EventCard.tsx
- [ ] T021 [P] [US2] Create EventList component in web/src/components/events/EventList.tsx
- [ ] T022 [P] [US2] Create EventDetail component in web/src/components/events/EventDetail.tsx
- [ ] T023 [P] [US2] Create EventYearNavigator component in web/src/components/events/EventYearNavigator.tsx
- [ ] T024 [P] [US2] Create EventFilter component in web/src/components/events/EventFilter.tsx
- [ ] T025 [US2] Implement public events list page in web/src/app/(app)/events/page.tsx (depends on T020, T021, T023, T024)
- [ ] T026 [US2] Implement public event details page in web/src/app/(app)/events/[id]/page.tsx (depends on T022)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Authorization & Security (Priority: P3)

**Goal**: Proper access control and security measures are in place

**Independent Test**: Non-admin users cannot access admin routes, RLS policies enforce data access

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T027 [P] [US3] E2E test for non-admin cannot access admin routes in web/tests/e2e/events.spec.ts

### Implementation for User Story 3

- [ ] T028 [US3] Verify RLS policies are working correctly for events table
- [ ] T029 [US3] Verify Storage RLS policies are working for event-banners bucket
- [ ] T030 [US3] Add admin-only middleware check to admin event routes

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T031 [P] Add loading states to all event pages and components
- [ ] T032 [P] Add error handling with user-friendly messages
- [ ] T033 [P] Add toast notifications for all user actions
- [ ] T034 Add responsive design for mobile, tablet, and desktop
- [ ] T035 Add image optimization with Next.js Image component
- [ ] T036 Add lazy loading for event images
- [ ] T037 Run quickstart.md validation scenarios
- [ ] T038 Performance optimization and Lighthouse audit

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Components before pages
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence