# Implementation Plan: Sistema de Eventos

**Branch**: `005-funcionalidade-de-eventos` | **Date**: 2025-10-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-funcionalidade-de-eventos/spec.md`

---

## Summary

Implementar um sistema completo de gestão de eventos da igreja, permitindo que administradores criem, editem e gerenciem eventos com banners/imagens, enquanto usuários comuns podem visualizar e consultar eventos futuros e passados por ano.

**Complexidade**: Média
**Risco**: Baixo (reutiliza padrões estabelecidos na Feature 004)
**Duração Estimada**: 5-7 dias

**Technical Approach**: Utilizar Next.js 15.5.5 App Router com Server Components para renderização, Server Actions para mutações, Supabase PostgreSQL para persistência, Supabase Storage para upload de imagens, e RLS policies para controle de acesso. Reutilizar componentes e padrões da Feature 004 (Área Administrativa).

---

## Technical Context

**Language/Version**: TypeScript 5.x + Next.js 15.5.5 + React 19.1.0
**Primary Dependencies**:
- Next.js (App Router, Server Components, Server Actions)
- React 19.1.0 (Client Components para interatividade)
- Supabase JS Client (auth, database, storage)
- Tailwind CSS 3.4.18 (estilização)
- shadcn/ui (Alert Dialog, Form, Input, Button, Card, etc.)
- Zod (validação de schemas)
- date-fns (formatação de datas)
- Sonner (toast notifications)
- Lucide React (ícones)

**Storage**:
- PostgreSQL via Supabase (tabela `events`)
- Supabase Storage (bucket `event-banners` para imagens)

**Testing**:
- Playwright (E2E tests)
- Vitest (unit tests - opcional)

**Target Platform**: Web (Next.js SSR + Client-side hydration)

**Project Type**: Web application (frontend Next.js + backend Supabase)

**Performance Goals**:
- Page load < 2s (Server Components)
- Image upload < 5s para 2MB
- Lighthouse Score > 90

**Constraints**:
- Imagens max 2MB (JPG/PNG/WEBP)
- RLS policies obrigatórias
- Soft delete (manter dados no banco)
- Compatível com Feature 004 (admin area)

**Scale/Scope**:
- Estimativa: 100-200 eventos por ano
- Usuários: 50-100 concurrent
- Storage: ~50MB de imagens

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Project Standards (from CLAUDE.md)

✅ **Database Naming**: English snake_case (per Constitution v1.2.0)
- Table: `events` ✅
- Columns: `event_date`, `banner_url`, `created_by_user_id` ✅

✅ **Code Language**: English for all code and schemas ✅

✅ **Documentation Language**: Brazilian Portuguese (pt-BR) for specs/plans ✅

✅ **RLS Policies**: All tables must have RLS enabled ✅
- Policy: `admins_manage_all_events` ✅
- Policy: `users_view_active_events` ✅

✅ **Soft Delete Pattern**: Use `deleted_at` column (already established in Feature 004) ✅

✅ **Type Safety**: Generated TypeScript types from Supabase ✅

### No Constitutional Violations

All standards followed. No complexity tracking needed.

---

## Project Structure

### Documentation (this feature)

```
specs/005-funcionalidade-de-eventos/
├── spec.md              # Feature specification ✅
├── plan.md              # This file ✅
├── research.md          # Phase 0 output ✅
├── data-model.md        # Phase 1 output ✅
├── quickstart.md        # Phase 1 output ✅
└── contracts/           # Phase 1 output ✅
    ├── README.md        # API overview ✅
    ├── event-actions.md # CRUD operations ✅
    └── storage-actions.md # Image upload/delete ✅
```

### Source Code (repository root)

```
web/
├── src/
│   ├── app/(app)/
│   │   ├── admin/
│   │   │   ├── events/              # Admin event management 🆕
│   │   │   │   ├── page.tsx         # Admin event list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx     # Create event form
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx     # Event details (admin)
│   │   │   │   │   └── edit/
│   │   │   │   │       └── page.tsx # Edit event form
│   │   │   │   ├── actions.ts       # Server Actions (CRUD)
│   │   │   │   └── storage-actions.ts # Upload/delete images
│   │   │   └── layout.tsx           # Admin layout (exists, add link)
│   │   └── events/                  # Public event pages 🆕
│   │       ├── page.tsx             # User event list
│   │       └── [id]/
│   │           └── page.tsx         # Event details (public)
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminEventList.tsx   # Event list (admin) 🆕
│   │   │   ├── AdminEventForm.tsx   # Event form 🆕
│   │   │   └── AdminSidebar.tsx     # Update: add Events link
│   │   └── events/                  # Public components 🆕
│   │       ├── EventCard.tsx        # Event card
│   │       ├── EventList.tsx        # Event list with filters
│   │       ├── EventDetail.tsx      # Event detail view
│   │       ├── EventYearNavigator.tsx # Year navigation
│   │       └── EventFilter.tsx      # Filter toggle
│   └── lib/
│       ├── supabase/
│       │   └── database.types.ts    # Update: regenerate after migration
│       └── validations/
│           └── event.ts             # Zod schemas 🆕
└── tests/
    └── e2e/
        └── events.spec.ts           # E2E tests 🆕

supabase/
└── migrations/
    └── YYYYMMDDHHMMSS_create_events_table.sql # 🆕
```

**Structure Decision**: Web application (frontend + backend integrated)
- Frontend: Next.js App Router com Server/Client Components
- Backend: Next.js Server Actions + Supabase (database + storage)
- No API REST separada (Server Actions substituem REST API)

---

## Complexity Tracking

*N/A - No constitutional violations. All patterns follow established conventions.*

---

## Implementation Phases

### Phase 0: Research & Planning ✅ COMPLETE

**Artifacts Generated**:
- ✅ `research.md` - Technical investigation and architecture decisions
- ✅ `data-model.md` - Database schema, migrations, RLS policies
- ✅ `contracts/` - Server Actions API specifications
- ✅ `quickstart.md` - Manual testing scenarios

**Key Decisions Made**:
1. Upload direto via Supabase Storage (sem processamento server-side)
2. Server Components para listagens (SSR)
3. DATE sem timezone (simplicidade)
4. Soft delete pattern (reutilizado de Feature 004)
5. Reutilização máxima de componentes existentes

---

### Phase 1: Database & Infrastructure

**Goal**: Create database schema, migrations, and storage bucket

**Tasks**:
1. Create migration file `create_events_table.sql`
2. Apply migration locally (`supabase db reset`)
3. Verify RLS policies work (test with admin and non-admin users)
4. Create Storage bucket `event-banners` (via Supabase Dashboard or SQL)
5. Apply Storage RLS policies
6. Regenerate TypeScript types (`npx supabase gen types`)
7. Verify types include `events` table

**Validation**:
- [ ] Migration applies without errors
- [ ] Table `events` exists with all columns
- [ ] Indexes created correctly
- [ ] RLS policies enforced (test with `psql`)
- [ ] Storage bucket `event-banners` exists
- [ ] Storage RLS policies active
- [ ] TypeScript types updated

**Estimated Time**: 1 day

---

### Phase 2: Server Actions (Backend)

**Goal**: Implement all CRUD operations and file upload

**Tasks**:
1. Create `/admin/events/actions.ts`:
   - `createEventAction`
   - `updateEventAction`
   - `deleteEventAction`
   - `getEventAction`
   - `listEventsAction`

2. Create `/admin/events/storage-actions.ts`:
   - `uploadEventBannerAction`
   - `deleteEventBannerAction`

3. Create Zod validation schemas (`/lib/validations/event.ts`):
   - `EventFormSchema`
   - `BannerUploadSchema`

4. Test Server Actions with `curl` or Postman (manual)

**Validation**:
- [ ] All Server Actions compile without TypeScript errors
- [ ] Actions enforce authentication (reject if not logged in)
- [ ] Admin-only actions reject non-admins
- [ ] Validation schemas catch invalid inputs
- [ ] Upload validates file size and format
- [ ] Soft delete sets `deleted_at` correctly
- [ ] `revalidatePath()` called after mutations

**Estimated Time**: 1.5 days

---

### Phase 3: Admin UI (Event Management)

**Goal**: Build admin pages for CRUD operations

**Tasks**:

#### 3.1: Admin Event List (`/admin/events/page.tsx`)
- Server Component
- Query all events (including soft-deleted for admin)
- Display in table or cards
- Actions: Edit, Delete buttons
- Link to "Novo Evento"

#### 3.2: Create Event Form (`/admin/events/new/page.tsx`)
- Client Component (form interactivity)
- Fields: título, descrição, data, horário, local, banner upload, status
- File upload with preview
- Call `createEventAction` on submit
- Toast notification on success/error

#### 3.3: Edit Event Form (`/admin/events/[id]/edit/page.tsx`)
- Pre-fill form with existing event data
- Allow banner replacement
- Call `updateEventAction` on submit

#### 3.4: Event Details (Admin) (`/admin/events/[id]/page.tsx`)
- Server Component
- Display all event details
- Links to Edit/Delete

#### 3.5: Components (`/components/admin/`)
- `AdminEventList.tsx` - Reusable list component
- `AdminEventForm.tsx` - Reusable form component
- Update `AdminSidebar.tsx` - Add "Eventos" link

**Validation**:
- [ ] All admin pages accessible only by admins
- [ ] Non-admins redirect to `/dashboard`
- [ ] Forms validate inputs before submit
- [ ] Upload shows progress indicator
- [ ] Image preview works
- [ ] Toast notifications appear
- [ ] Navigation works (back buttons, links)

**Estimated Time**: 2 days

---

### Phase 4: Public UI (Event Viewing)

**Goal**: Build public pages for users to view events

**Tasks**:

#### 4.1: Public Event List (`/events/page.tsx`)
- Server Component
- Query events with filters (year, futureOnly)
- URL search params for filters (`?year=2025&filter=future`)
- Display in cards with images
- Filters: "Apenas Futuros" / "Todos do Ano"
- Year navigator: "< 2024 | 2025 >"

#### 4.2: Event Details (`/events/[id]/page.tsx`)
- Server Component
- Display full event details
- Large banner image
- Back button to list

#### 4.3: Components (`/components/events/`)
- `EventCard.tsx` - Event card for list
- `EventList.tsx` - List with filters
- `EventDetail.tsx` - Detail view
- `EventYearNavigator.tsx` - Year navigation
- `EventFilter.tsx` - Filter toggle

**Validation**:
- [ ] Public pages accessible to all authenticated users
- [ ] Filters work correctly
- [ ] Year navigation works
- [ ] Events ordered chronologically
- [ ] Dates formatted correctly (pt-BR)
- [ ] Images load with lazy loading
- [ ] Empty states display for no events
- [ ] Responsive design (mobile, tablet, desktop)

**Estimated Time**: 1.5 days

---

### Phase 5: Testing

**Goal**: Comprehensive testing of all scenarios

**Tasks**:

#### 5.1: Manual Testing (Quickstart)
- Follow all scenarios in `quickstart.md`
- Test as admin and regular user
- Test edge cases (large images, invalid formats, etc.)
- Test responsive design

#### 5.2: E2E Tests (Playwright)
- Create `tests/e2e/events.spec.ts`
- Test scenarios:
  1. Admin creates event with banner
  2. Admin edits event
  3. Admin deletes event (soft delete)
  4. User views event list
  5. User views event details
  6. User navigates between years
  7. User toggles filter
  8. Non-admin cannot access admin routes
  9. Upload validations (size, format)

#### 5.3: Performance Testing
- Run Lighthouse audit on key pages
- Verify image optimization
- Check query performance (EXPLAIN ANALYZE)

**Validation**:
- [ ] All quickstart scenarios pass
- [ ] E2E tests pass (min 8 test cases)
- [ ] Lighthouse scores > 90
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Build succeeds (`npm run build`)

**Estimated Time**: 1 day

---

### Phase 6: Polish & Documentation

**Goal**: Final touches and documentation updates

**Tasks**:
1. Add feature to CLAUDE.md (auto-generated)
2. Update README if needed
3. Code review and refactoring
4. Fix any ESLint warnings
5. Optimize bundle size
6. Update `.gitignore` if needed (e.g., ignore test uploads)
7. Create sample data (seed) for development

**Validation**:
- [ ] Code is clean and documented
- [ ] No TODO comments remain
- [ ] ESLint warnings resolved
- [ ] Bundle size reasonable (<50KB added)
- [ ] Sample data available for testing

**Estimated Time**: 0.5 day

---

## Progress Tracking

### Overall Progress

- [x] Phase 0: Research & Planning (100%)
- [ ] Phase 1: Database & Infrastructure (0%)
- [ ] Phase 2: Server Actions (0%)
- [ ] Phase 3: Admin UI (0%)
- [ ] Phase 4: Public UI (0%)
- [ ] Phase 5: Testing (0%)
- [ ] Phase 6: Polish & Documentation (0%)

**Total Estimated Time**: 7.5 days (can be reduced to 5 days if working full-time)

---

## Dependencies

### Internal Dependencies

- ✅ Feature 004 (Área Administrativa) - COMPLETE
- ✅ Authentication system (Supabase Auth) - EXISTS
- ✅ Admin layout and sidebar - EXISTS
- ✅ shadcn/ui components - INSTALLED
- ✅ Supabase client setup - EXISTS

### External Dependencies

- Supabase local instance running
- Node.js + npm
- Docker (for Supabase local)
- Browser (for testing)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Upload de imagens maliciosas | Low | High | Validação MIME type + tamanho, RLS policies, apenas admins |
| RLS policies incorretas | Medium | High | Testar com admin e não-admin, seguir pattern existente |
| Performance com muitas imagens | Low | Medium | Lazy loading, Next.js Image optimization |
| Timezone issues com datas | Low | Medium | Usar DATE (sem timezone), assumir local Brasil |
| Storage limits (free tier 1GB) | Low | Low | Estimativa: 50MB para MVP, suficiente |

---

## Success Criteria

### Functional

- [x] Specification complete and reviewed
- [x] All artifacts generated (research, data-model, contracts, quickstart)
- [ ] Database migration applied successfully
- [ ] All Server Actions implemented and working
- [ ] Admin UI complete (CRUD operations)
- [ ] Public UI complete (viewing and filtering)
- [ ] RLS policies enforced
- [ ] Image upload working with validations
- [ ] All 8 acceptance scenarios from spec passing
- [ ] E2E tests passing

### Quality

- [ ] Type-safe (no `any` types without justification)
- [ ] Zod validation in all forms
- [ ] Loading states in all async operations
- [ ] Toast notifications for user feedback
- [ ] Error handling with user-friendly messages
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Lighthouse score > 90
- [ ] No TypeScript compilation errors
- [ ] No ESLint warnings (or justified)
- [ ] Build succeeds without errors

### Performance

- [ ] Page load < 2s (Server Components)
- [ ] Image upload < 5s for 2MB
- [ ] Query time < 10ms (with indexes)
- [ ] Images lazy load
- [ ] Bundle size increase < 50KB

---

## Next Steps

1. **Review this plan** with stakeholder/user
2. **Start Phase 1**: Create database migration
3. **Follow phases sequentially** or in parallel if possible
4. **Update progress tracking** after each task
5. **Run `/tasks` command** to generate detailed task breakdown

---

## Notes

### Reusable Patterns (from Feature 004)

- AdminShell component
- AdminSidebar navigation
- AdminBreadcrumbs
- Server Actions pattern
- getUser() for auth validation
- Soft delete pattern (`deleted_at`)
- Toast notifications (Sonner)
- AlertDialog for confirmations
- Form validation with Zod
- Loading states with Suspense

### New Patterns Introduced

- File upload with preview
- Supabase Storage integration
- Year-based filtering
- Date formatting (pt-BR)
- Image optimization with Next.js Image

---

**Plan Version**: 1.0
**Last Updated**: 2025-10-20
**Status**: Ready for Implementation

**Next Command**: `/tasks` (to generate detailed task breakdown)
