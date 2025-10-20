# Quickstart: Sistema de Eventos - Manual Testing

**Feature**: 005-funcionalidade-de-eventos
**Purpose**: Manual validation scenarios for testing the Events system
**Date**: 2025-10-20

---

## Prerequisites

### 1. Database Setup

```bash
# Start Supabase
cd /Users/rafael/dev/carmelo-app
supabase start

# Apply migration
supabase migration new create_events_table
# (paste SQL from data-model.md)
supabase db reset

# Regenerate types
npx supabase gen types --lang=typescript --local > web/src/lib/supabase/database.types.ts
```

### 2. Test Users

Ensure you have:
- **Admin user**: `admin@exemplo.com` (is_admin = true)
- **Regular user**: `user@exemplo.com` (is_admin = false)

### 3. Dev Server

```bash
cd web
npm run dev
```

Access: http://localhost:3000

---

## Scenario 1: Admin Creates Event with Banner

**Goal**: Validate full event creation flow with image upload

**User**: admin@exemplo.com
**Expected Duration**: 3-5 minutes

### Steps

1. **Login as admin**
   - Navigate to http://localhost:3000/login
   - Enter: `admin@exemplo.com` / `admin123`
   - Click "Entrar"
   - ✅ Should redirect to `/dashboard`

2. **Navigate to events admin**
   - Click "Área Administrativa" in sidebar (or navigate to `/admin`)
   - Click "Eventos" in admin sidebar
   - ✅ Should see `/admin/events` page
   - ✅ Should see "Nova Evento" button
   - ✅ Should see empty state if no events exist

3. **Create new event**
   - Click "Novo Evento" button
   - ✅ Should navigate to `/admin/events/new`
   - ✅ Form should have fields: título, descrição, data, horário, local, banner

4. **Fill event details**
   - **Título**: "Conferência de Jovens 2025"
   - **Descrição**: "Três dias de conferências, workshops e momentos de adoração voltados para jovens de 15 a 30 anos."
   - **Data**: Select "2025-11-15" (use date picker)
   - **Horário**: "19:00"
   - **Local**: "Auditório Principal"
   - **Status**: Leave as "Agendado" (default)

5. **Upload banner image**
   - Click "Escolher Imagem" or file input
   - Select a JPG/PNG image < 2MB from your computer
   - ✅ Should see image preview immediately
   - ✅ Upload progress indicator should appear
   - ✅ Preview should show uploaded image

6. **Submit form**
   - Click "Criar Evento" button
   - ✅ Should see loading state on button
   - ✅ Toast notification: "Evento criado com sucesso!"
   - ✅ Should redirect to `/admin/events`
   - ✅ Should see new event in list with banner thumbnail

### Validation

- [ ] Event appears in admin list
- [ ] Banner image displays correctly
- [ ] All fields match input values
- [ ] Event has status "Agendado"
- [ ] Event date is formatted correctly ("15 de Novembro de 2025")

---

## Scenario 2: Admin Edits Event

**Goal**: Validate event editing and banner replacement

**User**: admin@exemplo.com
**Expected Duration**: 2-3 minutes

### Steps

1. **Navigate to event edit**
   - From `/admin/events`, find "Conferência de Jovens 2025"
   - Click "Editar" button/icon
   - ✅ Should navigate to `/admin/events/[id]/edit`
   - ✅ Form should be pre-filled with existing event data

2. **Modify event details**
   - Change **Data** to "2025-11-16"
   - Change **Horário** to "20:00"
   - Add to **Descrição**: " Haverá coffee break."

3. **Replace banner (optional)**
   - Click "Substituir Imagem"
   - Select a different image
   - ✅ Preview should update with new image

4. **Save changes**
   - Click "Salvar Alterações"
   - ✅ Toast: "Evento atualizado com sucesso!"
   - ✅ Should redirect to `/admin/events` or `/admin/events/[id]`
   - ✅ Changes should be visible

### Validation

- [ ] Date changed to "16 de Novembro de 2025"
- [ ] Time changed to "20:00"
- [ ] Description includes new text
- [ ] Banner replaced (if uploaded new one)

---

## Scenario 3: Admin Deletes Event

**Goal**: Validate soft delete with confirmation

**User**: admin@exemplo.com
**Expected Duration**: 1 minute

### Steps

1. **Navigate to events list**
   - Go to `/admin/events`
   - Find "Conferência de Jovens 2025"

2. **Delete event**
   - Click "Excluir" button/icon
   - ✅ Alert Dialog should appear: "Tem certeza que deseja excluir este evento?"
   - ✅ Should show event title in confirmation message

3. **Confirm deletion**
   - Click "Excluir" in dialog
   - ✅ Dialog closes
   - ✅ Toast: "Evento excluído com sucesso!"
   - ✅ Event disappears from list
   - ✅ Empty state appears if no events remain

### Validation

- [ ] Event removed from admin list
- [ ] Event does not appear in public list (`/events`)
- [ ] Database: `deleted_at` is NOT NULL
- [ ] Banner image still exists in storage (soft delete)

---

## Scenario 4: User Views Events List

**Goal**: Validate public event listing for regular users

**User**: user@exemplo.com
**Expected Duration**: 2 minutes

### Steps (Setup: Create 3 events as admin first)

**Admin Setup**:
1. Create event "Culto de Páscoa" - date: 2025-04-20, status: agendado
2. Create event "Retiro de Carnaval" - date: 2025-03-01, status: agendado
3. Create event "Workshop de Música" - date: 2024-12-10, status: concluído

**User Testing**:

1. **Logout admin and login as user**
   - Logout (if logged as admin)
   - Login as `user@exemplo.com` / `user123`

2. **Navigate to events**
   - Go to http://localhost:3000/events
   - ✅ Should see page title "Eventos da Igreja"
   - ✅ Should see filter toggle: "Apenas Futuros" / "Todos do Ano"
   - ✅ Should see year navigator: "< 2024 | 2025 >"

3. **View default (future events only)**
   - Default filter: "Apenas Futuros"
   - ✅ Should see only: "Retiro de Carnaval" and "Culto de Páscoa"
   - ✅ Should NOT see "Workshop de Música" (past event)
   - ✅ Events ordered chronologically (Retiro → Culto)

4. **Toggle to "Todos do Ano"**
   - Click "Todos do Ano" toggle
   - ✅ Should now see all 3 events of 2025 (including past)
   - ✅ Still ordered chronologically

5. **Navigate to previous year**
   - Click "< 2024" button
   - ✅ URL updates to `/events?year=2024`
   - ✅ Should see "Workshop de Música"
   - ✅ Should NOT see 2025 events

6. **Back to current year**
   - Click "2025 >" button
   - ✅ Returns to 2025 events

### Validation

- [ ] Only future events shown by default
- [ ] Toggle works correctly
- [ ] Year navigation works
- [ ] Events ordered chronologically (earliest first)
- [ ] Each card shows: banner, title, date, time, location
- [ ] Date formatted correctly ("20 de Abril de 2025")

---

## Scenario 5: User Views Event Details

**Goal**: Validate event detail page

**User**: user@exemplo.com
**Expected Duration**: 1 minute

### Steps

1. **From events list** (`/events`)
   - Click on "Culto de Páscoa" event card
   - ✅ Should navigate to `/events/[id]`

2. **View event details**
   - ✅ Should see large banner image (if exists)
   - ✅ Should see title: "Culto de Páscoa"
   - ✅ Should see full description
   - ✅ Should see formatted date: "20 de Abril de 2025"
   - ✅ Should see time: "10:00"
   - ✅ Should see location: "Templo Central"
   - ✅ Should see "Voltar" button

3. **Return to list**
   - Click "Voltar" or browser back button
   - ✅ Should return to `/events`

### Validation

- [ ] All event details displayed correctly
- [ ] Banner image loads (if exists)
- [ ] Description formatted with line breaks
- [ ] Navigation works

---

## Scenario 6: Non-Admin Cannot Access Admin Routes

**Goal**: Validate authorization controls

**User**: user@exemplo.com
**Expected Duration**: 1 minute

### Steps

1. **Attempt to access admin events**
   - Manually navigate to http://localhost:3000/admin/events
   - ✅ Should redirect to `/dashboard`
   - ✅ May show toast: "Acesso negado"

2. **Attempt to access event creation**
   - Manually navigate to http://localhost:3000/admin/events/new
   - ✅ Should redirect to `/dashboard`

3. **Verify sidebar**
   - Check main navigation sidebar
   - ✅ Should NOT see "Área Administrativa" link (hidden for non-admins)

### Validation

- [ ] Non-admin cannot access admin routes
- [ ] Redirects to dashboard
- [ ] Admin links hidden in UI

---

## Scenario 7: Edge Cases

**Goal**: Test validation and error handling

**User**: admin@exemplo.com
**Expected Duration**: 5 minutes

### 7.1: Upload Invalid Image Format

1. Navigate to `/admin/events/new`
2. Try to upload GIF or SVG file
3. ✅ Should show error: "Formato inválido. Use JPG, PNG ou WEBP"
4. ✅ File should not upload

### 7.2: Upload Large Image (> 2MB)

1. Try to upload image > 2MB
2. ✅ Should show error: "Imagem deve ter no máximo 2MB"
3. ✅ File should not upload

### 7.3: Submit Event Without Required Fields

1. Leave **Título** empty
2. Click "Criar Evento"
3. ✅ Should show validation error: "Título é obrigatório"
4. ✅ Form should not submit

5. Fill título, leave **Data** empty
6. Click "Criar Evento"
7. ✅ Should show validation error: "Data é obrigatória"

### 7.4: Create Event Without Banner

1. Fill all required fields (título, data)
2. Do NOT upload banner
3. Submit form
4. ✅ Event should be created successfully
5. ✅ In list, should show placeholder image or no image area

### 7.5: Year With No Events

1. Navigate to `/events`
2. Use year navigator to go to 2020 (assuming no events exist)
3. ✅ Should show empty state: "Nenhum evento cadastrado para este ano"

### 7.6: Future Events Empty

1. Assuming all events are in the past
2. Navigate to `/events` with "Apenas Futuros" filter
3. ✅ Should show empty state: "Não há eventos futuros programados"

### Validation

- [ ] All validations working correctly
- [ ] Error messages clear and helpful
- [ ] Edge cases handled gracefully
- [ ] Empty states displayed

---

## Scenario 8: Responsive Design

**Goal**: Test UI on different screen sizes

**User**: Any authenticated user
**Expected Duration**: 3 minutes

### 8.1: Mobile (375px)

1. Open browser DevTools
2. Set viewport to iPhone SE (375px width)
3. Navigate through:
   - `/events` - list view
   - `/events/[id]` - detail view
   - `/admin/events` (as admin)
   - `/admin/events/new` (as admin)

**Check**:
- [ ] Event cards stack vertically
- [ ] Images scale correctly
- [ ] Text is readable (no overflow)
- [ ] Buttons are touch-friendly (min 44x44)
- [ ] Forms are usable
- [ ] Sidebar collapses or becomes hamburger menu

### 8.2: Tablet (768px)

1. Set viewport to iPad (768px width)
2. Navigate same routes

**Check**:
- [ ] Layout adapts to tablet size
- [ ] Event cards may display in 2 columns
- [ ] Sidebar visible or collapsible

### 8.3: Desktop (1280px+)

1. Set viewport to desktop (1920px width)
2. Navigate same routes

**Check**:
- [ ] Event cards in grid (3-4 columns)
- [ ] Sidebar fully visible
- [ ] No excessive whitespace
- [ ] Images display at appropriate sizes

---

## Performance Checklist

Run these checks after all scenarios:

### Lighthouse Audit

```bash
# Run Lighthouse on key pages
npm run lighthouse /events
npm run lighthouse /events/[some-id]
npm run lighthouse /admin/events
```

**Target Scores**:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

### Image Optimization

- [ ] Banner images use Next.js `<Image>` component
- [ ] Images lazy load
- [ ] Placeholder blur effect works
- [ ] Responsive images (srcset) generated

### Query Performance

```sql
-- Check query plans
EXPLAIN ANALYZE
SELECT * FROM events
WHERE deleted_at IS NULL
  AND event_date >= CURRENT_DATE
ORDER BY event_date ASC;
```

- [ ] Uses `idx_events_date` index
- [ ] Query time < 10ms

---

## Cleanup

After testing, clean up test data:

```sql
-- Delete test events
DELETE FROM events WHERE title LIKE '%Test%';

-- Clean up storage
-- (manually delete test images from Supabase Dashboard > Storage > event-banners)
```

---

## Troubleshooting

### Issue: "Não autenticado" errors

**Solution**:
- Clear browser cookies
- Login again
- Check Supabase local instance is running

### Issue: Images not uploading

**Solution**:
- Check `event-banners` bucket exists
- Verify Storage RLS policies are applied
- Check browser console for errors

### Issue: Events not appearing

**Solution**:
- Check `deleted_at IS NULL` in queries
- Verify RLS policies allow SELECT
- Check year filter is correct

### Issue: Redirect loops

**Solution**:
- Check admin layout middleware
- Verify `is_admin` flag is set correctly
- Clear Next.js cache: `rm -rf .next`

---

**Document Version**: 1.0
**Last Updated**: 2025-10-20
**Estimated Total Testing Time**: 20-30 minutes
