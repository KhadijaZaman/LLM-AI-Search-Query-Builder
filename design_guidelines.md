# LLM Query Builder - Design Guidelines

## Design Approach

**Selected System:** Carbon Design System (IBM)

**Rationale:** This enterprise-grade analytics tool demands a system built for data-heavy applications. Carbon excels at complex workflows, multi-step processes, and information density while maintaining clarity and professional aesthetics.

## Core Design Elements

### Typography
- **Primary Font:** IBM Plex Sans (via Google Fonts CDN)
- **Headings:** 
  - H1: 2.5rem, semibold (Tool title, page headers)
  - H2: 2rem, semibold (Section headers, step titles)
  - H3: 1.5rem, medium (Card headers, subsections)
  - H4: 1.25rem, medium (Component labels)
- **Body:** 1rem, regular for content; 0.875rem for secondary text
- **Code/Data:** IBM Plex Mono for domain names, queries, technical values

### Layout System
**Spacing Units:** Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Consistent padding: p-6 for cards, p-8 for main sections, p-4 for compact areas
- Margins: mb-8 between major sections, mb-4 between related elements
- Gaps: gap-4 for grids/flexbox, gap-6 for larger separations

### Component Library

**Navigation & Structure:**
- **Top Bar:** Fixed header with logo, region selector dropdown, Export CSV button
- **Progress Stepper:** Horizontal timeline showing 10 pipeline steps with completion states
- **Side Panel:** Collapsible filters/settings (region, domain input, advanced options)

**Forms & Inputs:**
- **Domain Input:** Large, prominent search-style input with validation states
- **Region Selector:** Dropdown with flag icons and full country names
- **Action Buttons:** Primary (Start Analysis), Secondary (Export), Ghost (Reset)
- **Input Fields:** Single-line with floating labels, helper text below

**Data Display:**
- **Analysis Cards:** Elevated cards (shadow-md) with header, content area, and action footer
- **Entity Tables:** Sortable columns with alternating row backgrounds, sticky headers
- **Query List:** Virtualized scrollable list with query text, topic tag, intent badge
- **Knowledge Graph Visualization:** D3.js/Cytoscape integration area with zoom controls
- **Metrics Dashboard:** 4-column grid showing key stats (Total Queries, Generic %, Branded %, Coverage)

**Status & Feedback:**
- **Loading States:** Step-by-step progress indicators with completion percentages
- **Success/Error Toasts:** Top-right notifications with icons
- **Badges:** Pill-shaped tags for query intent (Informational, Commercial, Transactional)
- **Empty States:** Centered illustrations with actionable CTAs

**Overlays:**
- **Modal Dialogs:** Export options, settings configuration
- **Tooltips:** Hover explanations for complex terms (Knowledge Graph, JTBD)
- **Popovers:** Inline help for form fields

### Page Structure

**Main Application Layout:**
```
[Fixed Header: Logo | Region Dropdown | Export Button]
[Progress Stepper: 9 Steps with active/complete/pending states]
[Main Content Area]
  - Domain Input Section (centered, max-w-2xl)
  - Analysis Results (2-column grid on desktop, stack on mobile)
    Left: Entities, Pain Points, Personas (scrollable)
    Right: Queries List (scrollable)
  - Knowledge Graph Visualization (full-width section)
[Footer: Attribution, API status indicators]
```

**Responsive Breakpoints:**
- Mobile (<640px): Single column, collapsible sections
- Tablet (640-1024px): 1-2 columns, condensed spacing
- Desktop (>1024px): Full 2-column layout, expanded data tables

### Images
**No hero images** - This is a data-focused application tool. Visual elements consist of:
- Small logo/wordmark in header
- Step icons in progress stepper (from Heroicons - document-search, globe, chart-bar, etc.)
- Illustration for empty state when no analysis has been run yet
- Flag icons for region selector

### Animations
**Minimal, purposeful motion:**
- Step completion: Green checkmark fade-in (300ms)
- Loading spinners: Rotating indicators during processing
- Card expansion: Smooth height transition when revealing details (200ms ease)
- **No scroll animations, parallax, or decorative motion**

### Accessibility
- All interactive elements have visible focus states (ring-2 ring-blue-500)
- ARIA labels for complex components (progress stepper, graph visualization)
- Keyboard navigation for multi-step workflow
- Color contrast minimum 4.5:1 for all text
- Screen reader announcements for step completion

---

**Production Notes:**
- Use Heroicons for consistent iconography throughout
- Implement virtualized scrolling for query lists (100+ items)
- CSV export triggers browser download, no server storage
- Region parameter persists across analysis runs in session storage