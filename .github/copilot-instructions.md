# DoggoLoggo - AI Copilot Instructions

## Project Overview

**DoggoLoggo** is a React + Vite pet tracking application for managing dog profiles and health metrics. The app features a three-page architecture with client-side routing using React Router.

### Tech Stack
- **Framework:** React 19.2 with Vite 7 (HMR enabled)
- **Routing:** React Router (handles `/`, `/dashboard`, `/dog/:id`)
- **Styling:** Inline styles + global theme CSS variables (no CSS-in-JS libraries)
- **Build:** Vite with ESLint flat config
- **Data:** Mock data in `src/data/mockData.js` (currently hardcoded, no backend)

## Architecture & Data Flow

### Page Structure
1. **Login (`/`)** - Simple form with email/password fields. Currently no auth validation; any non-empty email+password redirects to `/dashboard`.
2. **Dashboard (`/dashboard`)** - Grid of `DogCard` components fetching dogs from `mockData.dogs`, navigates to individual dog pages on click.
3. **DogPage (`/dog/:id`)** - Detail view with dog photo, stats, and placeholder graphs. Finds dog from mock data using URL ID param.

### Component Hierarchy
```
App (Routes)
├── Login
├── Dashboard
│   └── DogCard (multiple)
└── DogPage
    └── GraphPlaceholder (multiple)
```

### Data Patterns
- **Data source:** `src/data/mockData.js` exports default object with `dogs` array
- **Dog object shape:** `{ id, name, age, favoriteFood, photo }`
- **Mock images:** Use placedog.net API (`https://placedog.net/400/400?id=<dogId>`)
- **No external API yet:** All data is static; backend integration points are in DogPage and Dashboard data fetching

## Developer Workflows

### Local Development
```bash
npm run dev         # Start Vite dev server (HMR enabled) on http://localhost:5173
npm run build       # Production build to dist/
npm run lint        # Run ESLint on all .js/.jsx files
npm run preview     # Preview production build locally
```

### Key Files for Common Tasks
- **Add new page:** Create in `src/pages/`, add Route in `src/App.jsx`
- **Add component:** Place in `src/components/`, export default
- **Update theme colors:** Edit CSS variables in `src/styles/theme.css` (used as `var(--yellow)`, `var(--brown)`, etc.)
- **Add mock data:** Extend `src/data/mockData.js` dogs array
- **Update navigation:** Modify `App.jsx` Routes or use `useNavigate()` hook in components

## Project-Specific Conventions

### Styling
- **Inline styles only** - Components define `const styles = {}` object at end of file with nested style properties
- **CSS variables:** Always reference theme colors via `var(--colorName)` from `theme.css`
- **Grid layouts:** Use CSS Grid with `minmax()` for responsive card grids (see `Dashboard.jsx`)
- **Consistent spacing:** Padding/margins follow pattern of `10px`, `15px`, `20px`, `40px`

### Component Patterns
- **Functional components** with hooks (`useState`, `useNavigate`, `useParams`)
- **Props pattern:** Components receive data via props; no context API or state management
- **Navigation:** Always use `useNavigate()` hook and call `navigate(path)` on click handlers
- **Responsive images:** Circular photos use `borderRadius: "50%"` and `objectFit: "cover"` for consistency

### Naming Conventions
- **Components:** PascalCase in `src/components/` (e.g., `DogCard.jsx`, `GraphPlaceholder.jsx`)
- **Pages:** PascalCase in `src/pages/` (e.g., `Login.jsx`, `Dashboard.jsx`)
- **Imports:** Import mockData as `mockData`, access via `mockData.dogs` (see `Dashboard.jsx`, `DogPage.jsx`)
- **Event handlers:** Use `handleXxx` naming (e.g., `handleLogin` in Login.jsx)

### React/ESLint Rules
- **Unused vars:** Configured to ignore uppercase/underscore-prefixed variables (e.g., `_unused` is OK)
- **React Hooks:** ESLint enforces hooks rules; use `useNavigate()` for routing, `useState()` for form inputs
- **No TypeScript:** Project uses plain JavaScript; types enforced only via ESLint patterns

## Integration Points & Future Extensions

### Known Placeholders
- **Authentication:** Login page has no backend validation; email/password are checked client-side only
- **Graphs:** `GraphPlaceholder` component is a stub for future data visualization (on `DogPage`)
- **Backend:** No API calls yet; add fetch/axios calls in Dashboard and DogPage to replace mockData usage

### Adding Backend Integration
When connecting a real API, update:
1. `src/pages/Dashboard.jsx` - Replace `mockData.dogs` with API fetch in `useEffect()`
2. `src/pages/DogPage.jsx` - Replace `mockData.dogs.find()` with individual dog API call
3. Create `src/data/api.js` for centralized API client (recommended pattern)

### Extending GraphPlaceholder
- Current implementation shows placeholder box; pass `data` prop and replace with real chart library (e.g., recharts, chart.js)
- Keep inline styles for consistency with rest of codebase

## Common Commands Reference

| Task | Command |
|------|---------|
| Start dev | `npm run dev` |
| Build for prod | `npm run build` |
| Check lint errors | `npm run lint` |
| Preview prod build | `npm run preview` |
| Add dependency | `npm install <package>` |

## Quick Debugging Tips

- **HMR not working?** Ensure Vite dev server is running (`npm run dev`)
- **Route not found?** Check `src/App.jsx` for correct Route path and component import
- **Styling issues?** Verify CSS variable names in `theme.css` match usage (e.g., `var(--brown)`)
- **Mock data not loading?** Check import path is `../data/mockData.js` with capital `D` in mockData
- **Lint errors?** Run `npm run lint` to identify all issues; common: unused imports, missing deps in hooks

## Files to Know

| File | Purpose |
|------|---------|
| `src/App.jsx` | Route definitions (main entry point for pages) |
| `src/components/DogCard.jsx` | Reusable dog profile card component |
| `src/components/GraphPlaceholder.jsx` | Stub for future graphs |
| `src/data/mockData.js` | Central mock dog data (primary data source) |
| `src/pages/Dashboard.jsx` | Dog list view with grid layout |
| `src/pages/DogPage.jsx` | Individual dog detail page |
| `src/pages/Login.jsx` | Login form (no real auth) |
| `src/styles/theme.css` | Global theme variables and base styles |
| `vite.config.js` | Vite build config with React plugin |
| `eslint.config.js` | ESLint rules (flat config) |
