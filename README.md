# basic-server-web

Public **Vite + React** auth UI for the private [`vlifeng/basic-server`](https://github.com/vlifeng/basic-server) API.

| Piece | Visibility |
| --- | --- |
| This frontend | **Public** (this repo + GitHub Pages) |
| API / NestJS / SMTP / JWT / `.env` | **Private** (never commit here) |

Live site: **https://vlifeng.github.io/basic-server-web/**

## Features

- Register → always navigates to `/verify` (email code UX)
- Login, verify email, profile (`/me`), logout
- Shared Zod schemas vendored under `src/shared` (no private backend code)

## Configure API base

The browser calls the API at `VITE_API_BASE` (baked in at build time).

Current tunnel used for production Pages builds:

```
https://subscription-cats-panels-tremendous.trycloudflare.com
```

When the cloudflared API tunnel URL changes:

1. Update `VITE_API_BASE` in `.env.production` **or** set the GitHub Actions repository variable `VITE_API_BASE`
2. Push to `main` (or run **Actions → Deploy GitHub Pages → Run workflow**)

Do **not** put SMTP passwords, JWT secrets, or `.env` from the private API into this repo.

## Local development

```bash
npm install
# optional: point at a local or tunneled API
export VITE_API_BASE=http://127.0.0.1:3000
export VITE_BASE=/
npm run dev
```

## Build for GitHub Pages

```bash
export VITE_BASE=/basic-server-web/
export VITE_API_BASE=https://subscription-cats-panels-tremendous.trycloudflare.com
npm run build
```

## GitHub Pages

Deployment is via GitHub Actions (`.github/workflows/deploy-pages.yml`), which force-pushes the Vite `dist/` output to the `gh-pages` branch.

If the site 404s after the first deploy, enable Pages once:

**Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `gh-pages` / `/` (root)**

## Privacy

Only the SPA and Zod request/response schemas live here. The NestJS API, Redis session store, SMTP credentials, and JWT signing keys stay in the private backend repository.
