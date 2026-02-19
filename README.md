# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

# fpa-expo-dashboard

Coach/Admin dashboard for FPA built with React + Vite + TypeScript and backed by Supabase.

## Requirements

- Node.js (LTS)
- A Supabase project with the FPA schema (`clubs`, `club_users`, `club_staff`, etc.)

## Setup

1. Install dependencies

```bash
npm install
```

2. Configure env

Copy `.env.example` to `.env` and set:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-jwt>
```

Notes:

- `VITE_SUPABASE_ANON_KEY` must be the **anon public** key from Supabase **Project Settings → API**.
- After changing `.env`, restart `npm run dev`.

3. Run the dev server

```bash
npm run dev
```

Open:

- http://localhost:5173

## Supabase

### Migrations

Run SQL migrations from `supabase/migrations/` in Supabase **SQL Editor**.

- `supabase/migrations/001_test_results.sql`
  - creates `public.test_results`
  - enables RLS
  - adds select/insert policies for staff/admin

See `supabase/README.md`.

### Storage (athlete photos)

The dashboard uploads athlete photos to Supabase Storage:

- **Bucket**: `user-photos`
- **Path**: `club_users/<clubId>/<userId>.jpg`
- **Compression**: client-side JPEG compressed to **<= 65KB**

`club_users.image_url` stores the object path, and the UI uses signed URLs to display the image.

## Roles & permissions

Auth role detection:

- `admin`: Supabase RPC `is_admin_user()` returns `true`
- `staff`: has a row in `public.club_staff` for `auth.uid()`

RLS policies must allow relevant select/insert/update operations for these roles.

## Features

- Results table (filters: station/date range)
- Benchmarks (sex/age filters + histogram + percentiles)
- Leaderboard (top 3 per station, with filters)
- Athletes list + athlete profile (history chart + best-per-station)
- Create athlete (photo optional)
- Update athlete (edit fields + optional photo replacement)

## Admin club switching

Admins can switch the active club in the header. The selection is stored in localStorage:

- `fpa.activeClubId`

All pages (Results/Benchmarks/Leaderboard/Athletes) use the active club context.
