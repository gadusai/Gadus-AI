# Deployment instructions for the gadus frontend (Vercel)

This file contains copy-paste Vercel settings and quick steps to deploy the gadus Vite app from this monorepo.

---

## Recommended Vercel project settings (Option A — recommended)
Use these when creating or updating a Vercel project connected to this repository.

- Project Root: /
- Install Command:

  pnpm install --frozen-lockfile

- Build Command:

  pnpm --filter @workspace/gadus build

- Output Directory: leave blank (vercel.json in repo points to gadus/dist) — or set to `gadus/dist` if Vercel asks

- Environment Variables: add any keys your frontend needs (examples shown below)
- Node Version: set in Vercel Project Settings if you require a specific Node (e.g., `18.x` or `20.x`)

Notes:
- This option runs pnpm at the repo root and uses pnpm workspaces to build the gadus package.
- `vercel.json` is already present at the repo root and instructs Vercel to use `gadus/package.json` and the static builder.

---

## Simpler Vercel setup (Option B — project root inside the package)
If you prefer keeping Vercel scoped to the frontend package only:

- Project Root: `gadus`
- Install Command:

  pnpm install --frozen-lockfile

- Build Command:

  pnpm build

- Output Directory: `dist`

Notes:
- Use this if you want Vercel to run entirely inside the `gadus` folder. This is straightforward and works well for frontend-only deployments.

---

## Environment variables to add (examples)
Add keys required by your app in the Vercel Dashboard > Environment Variables. Examples (replace with your actual keys):

- NEXT_PUBLIC_API_BASE_URL (or API_BASE_URL) — base URL for your API
- CLERK_FRONTEND_API or CLERK_PUBLISHABLE_KEY — Clerk keys (if used)
- VITE_SENTRY_DSN or SENTRY_DSN — Sentry or other monitoring keys
- FEATURE_FLAG_X — any feature flags

Set variables for both Preview and Production environments as needed.

---

## How Vercel builds (summary)
- Vercel will run the Install Command to install dependencies.
- It runs the Build Command to produce the static output in `dist`.
- `@vercel/static-build` will pick up the `gadus/package.json` build script (vite build) and publish the `dist` folder.

---

## Triggering a deployment
1. Ensure the repository is connected to Vercel.
2. Create a new Vercel project from this repository or update an existing project's settings per one of the options above.
3. Push a commit (already done — `vercel.json` exists). Vercel will trigger a build.

---

## Note about the API (api-server)
- The `api-server` package is a bundled, long-running Express app (build -> `dist` + `start`). Vercel’s hosting is serverless and does not run long-lived Node servers. Options:
  - Deploy `api-server` to a host that supports long-running Node processes: Render, Fly, Railway, DigitalOcean App Platform, etc.
  - Convert API endpoints to Vercel Serverless Functions (requires refactor).
  - Use containers on a container-friendly host.

If you want, I can add step-by-step instructions to convert specific endpoints to Vercel functions or prepare a Dockerfile for another host.

---

## Quick checklist before you deploy
- [ ] Verify `pnpm-lock.yaml` is present (it is).
- [ ] Add required environment variables to Vercel.
- [ ] Choose Option A or B and set the project settings accordingly.
- [ ] Set Node version in Vercel if you require a specific version.
- [ ] Start a Vercel deployment and inspect build logs for errors.

---

If you want, I can also create a small GitHub Actions workflow to run a build check on pushes and PRs.
