# Jayed Hossain's HSC ICT MCQ Portal

MERN-style monorepo: a Next.js React client in `apps/web` and an Express + MongoDB API in `apps/api`.

## Run locally

1. Copy `apps/api/.env.example` to `apps/api/.env` and set the database, JWT, and SMTP values. For Gmail, create a Google App Password and use it as `SMTP_PASS`; never commit this file.
2. Run `npm install` from the repository root.
3. Run `npm run dev`.

The web app runs at `http://localhost:3000`; the API runs at `http://localhost:5000`.

The portal opens in guest mode. Guests can practice and view a temporary result; sign-in is required for history, performance data, and staff areas. Public registration always creates a student account—teacher and moderator accounts must be provisioned separately.

To load the initial HSC ICT chapters, sample question, and demo accounts, run `npm run seed -w @jayed/api` after configuring MongoDB. The seeded student (`student@example.com`), teacher (`jayed@example.com`), and moderator (`moderator@example.com`) use password `12345678` by default. Set `SEED_PASSWORD` to override it.

Question-editor English generation is configured to use the MyMemory translation API by default. It needs no key for basic use; configure `TRANSLATION_PROVIDER` and `TRANSLATION_API_URL` for a different or self-hosted provider.
