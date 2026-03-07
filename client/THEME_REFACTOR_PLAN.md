# Full Theme Refactor Plan — Approved & Implemented

**Goal:** Refactor the **entire UI theme** (not only colors) so it feels cohesive and human-made. **Layout and structure stay unchanged**; no new errors.

---

## 1. What “Entire Theme” Means (In Scope)

| Area | What we will define/change | What we will NOT change |
|------|----------------------------|--------------------------|
| **Color** | Full palette: canvas, cards, borders, text, brand, status. Light + dark. | Token names (e.g. `bg-card`, `text-primary`) so existing classes keep working. |
| **Typography** | Font families, sizes, weights, line-heights, letter-spacing. | Where text appears (no moving headings or labels). |
| **Shape & density** | Border radius (e.g. 6px vs 12px), shadow scale, default padding/spacing used in components. | Component structure, flex/grid, sidebar width, header height, number of columns. |
| **Components** | Visual style of Button, Input, Modal, Card, Table, Badge, etc. (borders, backgrounds, focus states). | Component APIs (props), DOM structure, layout. |
| **Motion** | Duration and easing of transitions/animations. | When/where animations run (no new motion that could affect layout). |

**Out of scope:** Changing routes, page structure, sidebar items, form flow, or any layout that could break responsiveness or cause runtime errors.

---

## 2. Design Direction — “Human Done”, Not AI-Generated

**Problems with typical “AI” look:**  
Purple/blue gradients, Inter everywhere, perfect 8px grid, same radius on everything, flat shadows, generic contrast.

**Proposed direction:**

- **Identity:** Golden Textile Dyers — textile/industrial, warm but professional. Feels like a tool built for a specific industry, not a generic SaaS.
- **Color:**
  - **Neutrals:** Warm stone/paper tones (not cold gray). Slight warmth in whites and off-whites.
  - **Brand:** One strong accent (e.g. deep amber/burnt orange or a muted teal) used sparingly — for primary actions, key highlights, active states. Not everywhere.
  - **Status:** Muted, readable greens/ambers/reds/blues that don’t fight the main palette.
  - **Contrast:** WCAG-friendly but not “maximum contrast” everywhere; secondary text can be softer.
- **Typography:**
  - **Body:** A readable, slightly characterful sans (e.g. Source Sans 3, Nunito Sans, or a similar “human” choice — not Inter/Roboto).
  - **Headings:** Same family with weight/size hierarchy, or a single complementary display weight. No second “trendy” font that feels tacked on.
  - **Numbers/code:** Monospace only where needed (tables, IDs, codes).
- **Shape & weight:**
  - **Radius:** One system (e.g. 6px small, 10px medium, 14px cards) — consistent but not “everything is rounded-xl”.
  - **Shadows:** Subtle, soft; used to separate layers (cards, dropdowns) not to decorate.
  - **Borders:** Thin, visible enough to read structure; not heavy.
- **Components:**
  - Buttons: Clear primary vs secondary; primary uses brand colour and slight depth (e.g. shadow or border), not flat.
  - Inputs: Clear border, subtle focus state (e.g. border + light ring), no overdone glow.
  - Cards/tables: Background, border, and padding that match the same radius/shadow system.
- **Dark mode (optional):** Same logic — warm or neutral darks, same accent, same radii/shadows. Implement only if you want it in this phase.

Result: A single, consistent “design language” that feels intentional and hand-tuned, not template-like.

---

## 3. Concrete Deliverables (No Layout Change)

1. **Design tokens (CSS variables + Tailwind)**
   - New palette (light, and dark if we include it).
   - Typography scale (font-family, sizes, weights) mapped to Tailwind.
   - Radius and shadow scales as variables/utilities.
   - All existing token names kept so `bg-card`, `text-primary`, `border-subtle`, etc. still work.

2. **Global styles**
   - `index.css`: variables, body, scrollbar, any shared utilities. No `@apply` with classes that Tailwind might not resolve (we stick to plain CSS where needed to avoid build errors).

3. **UI components (visual only)**
   - **Button:** Variants (primary, secondary, outline, ghost, danger) restyled; same props and sizes.
   - **Input / Select:** Border, focus, placeholder; same props.
   - **Modal:** Backdrop, panel, close button; same structure.
   - **MetricCard, StatusBadge, DecisionExplanation:** Use new tokens and radii/shadows only.
   - **Table, ReadOnlyTable, EmptyState, Skeleton, LoadingScreen:** Same structure; new colours, borders, typography.
   - **Cards:** `.industrial-card`, `.card-elevated` and any inline card styles updated to new radius/shadow/border.

4. **Shell (visual only)**
   - **Sidebar:** Same width, same nav items and structure; only colours, typography, active/hover states, icon/text style.
   - **Header:** Same height and search + notifications layout; only input style and background/border.

5. **Pages**
   - No layout or structure changes. Only swap in new tokens/classes where pages already use theme tokens (e.g. `bg-surface` → still works; pages already using tokens will pick up the new look).

6. **Error prevention**
   - No removal or renaming of Tailwind token names used in the codebase.
   - No changes to component props or JSX structure for layout (no new wrappers that change flex/grid).
   - Scrollbar and any `@apply` in CSS: use only utilities we know exist, or plain CSS with variables.
   - After each logical step: build and quick smoke test (e.g. login, dashboard, one list, one form).

---

## 4. Implementation Order (After Approval)

1. **Tokens & globals** — Update `index.css` and `tailwind.config.js` (colors, fonts, radius, shadows). Keep all existing token names.
2. **Primitive components** — Button, Input, Select, Modal, then MetricCard, StatusBadge, DecisionExplanation, EmptyState, Skeleton, LoadingScreen, Table, ReadOnlyTable.
3. **Shell** — Sidebar and DashboardLayout (visual only).
4. **Login** — Visual only.
5. **Cards & utilities** — `.industrial-card`, `.card-elevated`, any repeated card/panel patterns.
6. **Smoke test** — Click through main flows; fix any visual or build issues without changing layout.

---

## 5. What I Need From You (Approval)

Please confirm:

1. **Direction:** Are you okay with the “human done” direction above (warm neutrals, one strong accent, consistent radius/shadow, characterful but readable type)?
2. **Accent colour:** Prefer to keep **amber/gold** as the brand accent, or switch to another (e.g. muted teal, deep blue, burgundy)? One sentence is enough.
3. **Dark mode:** Include dark theme in this refactor (same theme, dark palette) or leave it for later?
4. **Scope:** Confirm that layout and structure must not change and that the only goal is a full, cohesive theme (no new features or layout redesign).

Once you approve this plan (and any tweaks you want), I’ll implement it step by step and keep layout intact with no errors.
