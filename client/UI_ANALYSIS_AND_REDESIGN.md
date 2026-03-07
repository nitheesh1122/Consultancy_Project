# Project UI Analysis & Redesign Plan

## Current state

- **Stack**: React 19, Vite, TypeScript, Tailwind CSS, Recharts, Framer Motion, Lucide icons.
- **Theme**: CSS variables in `index.css` drive Tailwind; design tokens for canvas/card/elevated, borders, text, brand (slate gray), status colors.
- **Fonts**: Inter (body), Space Grotesk (headings), JetBrains Mono (numbers/code).
- **Layout**: `DashboardLayout` = fixed Sidebar (64px) + top header with search + scrollable main; nested layouts for Analytics, HR, Settings.
- **Components**: Custom primitives in `components/ui/` (Button, Input, Modal, MetricCard, Table, Select, etc.) using `cn()` and token-based classes.
- **Pages**: 25+ routes (Home, Inventory, MRS, PI, Production, HR, Analytics, Settings, Login, etc.).
- **Dark mode**: Tailwind has `darkMode: 'class'` but no `dark:` classes or theme toggle in use.

## Redesign direction

- **Identity**: “Golden Textile Dyers” — move from neutral slate to a **gold/amber accent** with a clean, professional look.
- **Light theme**: Warm off-white canvas, crisp cards, golden primary actions and highlights.
- **Dark theme**: Optional; can be added later via same tokens.
- **Visual**: Slightly softer radii, clearer hierarchy, consistent spacing and shadows; keep industrial/ERP clarity.

## Implementation scope

1. **Design tokens** (`index.css`): New palette (gold primary, warm neutrals), optional dark variables.
2. **Tailwind**: Extend theme to use new tokens; keep existing utility names where possible.
3. **Shell**: Sidebar and header restyled (colors, spacing, active states).
4. **Login**: New layout and styling aligned with new brand.
5. **UI primitives**: Button, Input, Modal, MetricCard, etc. updated to new tokens.
6. **Pages**: Home and shared patterns updated so the rest of the app inherits the new look.

All changes stay within the existing structure (no new framework); pages that already use tokens will pick up the new UI automatically.
