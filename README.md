# Hana Trans — Invoice Approval

A standalone invoice approval workflow app: employees submit invoices, and
they are automatically routed through a multi-level approval chain based on
the invoice amount (configurable per-amount-range approval rules).

## Stack

- Next.js (App Router) + TypeScript
- PostgreSQL + Prisma
- NextAuth (Credentials provider, JWT sessions)
- Tailwind CSS
- Nodemailer for optional email notifications

## Features

- Submit invoices (with optional PDF/image attachment)
- Automatic multi-step approval routing based on configurable amount thresholds
- Sequential approval: each step must be approved before the next one activates
- Full audit trail / activity log per invoice
- In-app notifications (bell dropdown), with optional email via SMTP
- Admin pages to manage users/roles and approval rules
- QR code scan on uploaded receipt photos: auto-detects the embedded IČO and
  looks up the vendor name in the Slovak public business register (RPO)
- Optional AI-powered "fill from photo" button (Claude vision) that reads an
  uploaded invoice/receipt photo and pre-fills vendor, amount, date, and
  invoice number

## Roles

- `EMPLOYEE` — submits invoices
- `MANAGER`, `FINANCE`, `DIRECTOR` — approver roles used in approval chains
- `ADMIN` — manages users and approval rules; can also act as an approver on any step

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up PostgreSQL and copy `.env.example` to `.env`, filling in `DATABASE_URL`
   and a random `NEXTAUTH_SECRET`.

3. Run migrations and seed demo data:

   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

   This creates five demo users (password `Password123!` for all):

   | Email | Role |
   |---|---|
   | admin@hana-trans.sk | ADMIN |
   | manager@hana-trans.sk | MANAGER |
   | finance@hana-trans.sk | FINANCE |
   | director@hana-trans.sk | DIRECTOR |
   | employee@hana-trans.sk | EMPLOYEE |

   It also creates three default approval rules:

   - **< 500 EUR** → MANAGER
   - **500 – 5000 EUR** → MANAGER → FINANCE
   - **>= 5000 EUR** → MANAGER → FINANCE → DIRECTOR

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Notes

- Invoice attachments are stored in Vercel Blob storage when
  `BLOB_READ_WRITE_TOKEN` is set (enable "Blob" storage on the Vercel project
  and it's added automatically) — **required in production**, since
  serverless deployments don't have a writable/persistent disk. Without it,
  uploads fall back to local disk under `public/uploads`, which only works
  for local development.
- Email notifications are only sent if `SMTP_HOST` is set in `.env`; otherwise
  only in-app notifications are created.
- Approval rules are matched by amount range against the invoice's currency
  amount; make sure the configured ranges in Admin → Approval Rules cover the
  full amount space you expect, otherwise submission will be blocked with an
  error asking an admin to add a matching rule.
- The AI "fill from photo" button only appears once `ANTHROPIC_API_KEY` is
  set (get one at https://console.anthropic.com). Without it, invoices are
  filled in manually as before.
- The RPO (business register) lookup calls a public government API
  (`api.statistics.sk`) that hasn't been smoke-tested against a live network
  from this codebase's dev environment — if vendor auto-fill from QR codes
  doesn't work after deploying, check the response shape returned by that API
  and adjust `lookupCompanyByIco` in `src/lib/actions/enrichment.ts`
  accordingly.
