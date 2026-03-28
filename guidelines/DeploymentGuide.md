# Deployment Guide (GitHub Actions)

TruthByte uses a deploy workflow at `.github/workflows/deploy.yml`.

## What it does

- Waits for the CI workflow to complete successfully on `main`
- Triggers backend deployment through a deploy hook URL
- Triggers frontend deployment through a deploy hook URL
- Supports manual run via `workflow_dispatch`

## Required GitHub secrets

Add these in repository settings:

1. `BACKEND_DEPLOY_HOOK_URL`
2. `FRONTEND_DEPLOY_HOOK_URL`

Path in GitHub:

- Repository -> Settings -> Secrets and variables -> Actions -> New repository secret

## Where to get deploy hook URLs

Backend (common options):

- Render: service settings -> Deploy Hook
- Railway: service deploy trigger URL
- Any provider that supports webhook-triggered deploy

Frontend (common options):

- Netlify: Build hooks
- Vercel: Deploy hooks
- Any provider that supports webhook-triggered deploy

## How to test

1. Push a commit to `main` and wait for CI to pass.
2. Open Actions tab and confirm `Deploy` workflow runs automatically.
3. For manual check, run `Deploy` workflow with `Run workflow` button on `main`.

## Notes

- If either secret is missing, the related deploy job will be skipped.
- If you rename the CI workflow from `CI`, update `workflows: ["CI"]` in deploy workflow.
