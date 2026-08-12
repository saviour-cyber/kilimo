# SproutX

SproutX is a comprehensive agricultural management platform built with React, Express, tRPC, and Drizzle ORM.

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

### Required Variables
- `DATABASE_URL`: Connection string to your MySQL database.
- `APP_BASE_URL`: The public URL where this app is hosted (used for webhooks and email redirects).

### Billing Integration (Optional for local dev)
If you wish to test the subscription and billing flow:
- `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`: Required for credit card payments.
- `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE`: Required for M-PESA mobile payments (Daraja API).

### Email Notifications (Optional)
- `BREVO_API_KEY`: Required for sending email notifications (Account Verification, Invites, Dunning).

## Scheduled Jobs (Cron)
SproutX relies on scheduled jobs for background tasks such as enforcing subscription expiries and generating reminders. In production (e.g. Render), you should set up Cron Jobs to hit the following endpoints daily:

- `POST /api/scheduled/enforceSubscriptions` - Marks expired trials, past due accounts, and suspends delinquent organizations.
- `POST /api/scheduled/generateReminders` - Generates AI tasks and reminders for farm workers.

## Running the app

```bash
pnpm install
pnpm db:push
pnpm dev
```
