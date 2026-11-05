# Heartfold Ink: independent hosting

This edition has no ChatGPT login or connection requirement. It runs outside Sites. It is a prepared replacement, not a claim that the domain already runs it.

## What your host needs

- Linux server or application hosting supporting Node.js 24+, one Node process, and HTTPS reverse proxy. PHP-only hosting cannot run this build.
- Private, persistent disk for SQLite and customer files; a practical starting allowance is 1 GB RAM plus disk sized for uploads and backups. No shared/network SQLite disk or multiple application instances.
- A deployment method (SSH, a Node application control panel, or Docker), a way to configure secrets, and backups. Do not send passwords or keys in chat.
- Outbound HTTPS access for Stripe and email sending. No paid service is purchased or provisioned by this package.

## Customer and owner access

Customers can order, upload source letters and contact support as guests. A private HttpOnly cookie keeps each visit's requests separate. One visit uses one contact email; to use another email, end the session first. Keep the order reference.

Optional customer accounts use email verification/sign-in links, without passwords or any outside account connection. Accounts are created only after a link is verified. Website form email addresses alone cannot claim an existing account. Guest requests from that visit transfer to the verified account. An email sending service must be configured and tested to use verification or cross-device access; guest ordering remains available without it. Never claim email delivery works before testing it.

Guest order recovery requires the email plus reference. Older imported records containing several different contact emails under one old identity require owner assistance, rather than exposing all those records to one email address.

The owner uses a separate password at `/owner/login`, with an eight-hour session. Customer links never grant owner permissions. A password change in the private configuration invalidates existing owner sessions on restart. The password is stored only as a salted scrypt hash. The administrator username is not publicly registered through customer accounts.

## Install in a staging environment first

Use a staging hostname; do not change the production domain yet.

1. Extract the release on the server. It contains a ready-to-run build with no npm dependencies. Keep `.env`, `data/`, private snapshots and keys outside any web document root.
2. Run `node create-owner.mjs .env` in the server terminal. Enter a new password of at least 16 characters; the prompt hides it. Set `APP_ORIGIN` in that private file to the exact staging HTTPS origin (no trailing slash). Keep the file mode 0600. Use a different password from your Google/Stripe accounts.
3. Start with `node --env-file=.env server.cjs` under the host's process manager. Default backend is loopback port 8787. Node loads the private file directly; no shell sourcing is needed.
4. Connect the host's HTTPS reverse proxy to that port. A sample location block is supplied. Do not bypass certificate warnings. Add the platform's normal per-IP request limits at the proxy; the application also limits guest writes, email links and owner sign-in attempts. IP-based application limits trust X-Real-IP only from the exact IPs in TRUSTED_PROXY_IPS (loopback by default). The reverse proxy must overwrite this header, and the backend port must remain private. For Docker, configure the actual trusted proxy/gateway peer IP; do not trust arbitrary internet sources.
5. Configure private backup storage. Keep application-data snapshots and owner configuration backed up separately and securely. Restrict host/operator access to customer data.

Docker is optional: copy the release and private `.env`, then `docker compose up -d --build`. The named volume holds private data. Keep the published port on loopback behind HTTPS. The `.env` password hash uses single quotes so Docker Compose does not interpolate dollar signs. Do not bake `.env` or private files into an image; use the supplied `.dockerignore`.

## Bring across existing business settings, content and orders

Pause commissions and avoid owner edits on the old site. Download its owner-only complete recovery snapshot. Transfer it through your private deployment channel.

For a native Node installation whose new data directory does not exist:

`node import-backup.mjs PRIVATE_SNAPSHOT.json NEW_DATA_DIRECTORY`

This validates hashes, rebuilds SQLite and private files, and refuses an existing destination. It pauses new requests and resets domain, policy, customer-access, recovery and end-to-end checks for the new host. Price approvals are retained. Optional independent accounts are retained when included in an independent backup; active sessions and email tokens are intentionally excluded. Queued historical emails are put into a manual-check state so they are not sent twice.

Set DATA_DIR to that directory and start the server. Verify the saved product prices, guides, business settings, support history and files. Site login cookies do not migrate. Optional independent accounts do not exist until customers verify their email. Do not delete the old deployment or data before validating the import and rollback.

For Docker, import into a temporary native private directory first, then have the host deliberately copy the recovered contents to the stopped container's data volume with ownership suitable for the Node user. Verify before starting; do not run a new initialization over imported data.

## Payment and email connections

Stripe's live account currently has payments/payouts paused and an open support review. Do not enable real payments until Stripe clears it. Use a separate test key and signing secret for staging. Configure `STRIPE_SECRET_KEY` (a least-privilege restricted key is preferred) and `STRIPE_WEBHOOK_SECRET` in private runtime configuration. Register the staging endpoint `/api/webhook` with Stripe and verify signed events. This server exposes that endpoint without a website login while still requiring Stripe signature verification. No owner cookie is accepted as a substitute for a valid payment event.

The retained payment code pins `2026-02-25.clover`; confirm/update the supported version and matching webhook snapshots before live cutover. Do not use a preview version or guess an API-version string. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`.

For the existing transactional email adapter, configure `RESEND_API_KEY` and verified `MAIL_FROM`. A working Google Workspace mailbox alone does not configure this adapter. The sending provider needs its own authorised account/key and verified sender; no such provider is provisioned by this package. Test delivery, replies and privacy-processing terms. Without these settings, messages remain in the private dashboard queue, and email account creation/sign-in clearly reports unavailable.

## Required staging trial

- Browse the shop without any ChatGPT account; verify filters, word counts, guides, currency, reading options and both languages.
- Place a guest request and upload an incoming letter. In a second browser, confirm those requests/files are inaccessible.
- Create an optional customer account, receive and use its email link, recover the guest request and sign in on another browser. Confirm a used/expired link fails and a customer cannot open the owner dashboard.
- Sign in as owner, edit/save prices and content, review a request and approve its total/deadline. Verify unchanged saves keep confirmations and actual price changes reopen price review.
- Complete a sandbox purchase through the website; verify signed callbacks, PDF upload/release/download, support replies, notifications and refund.
- Stop the app, create a private snapshot using `node backup.mjs DATA_DIRECTORY NEW_SNAPSHOT.json`, restore into a new directory, and verify records/files. This is a manual offline backup; arrange scheduled encrypted off-server backups with the host.
- Check mobile, keyboard, screen reader, large text and HTTPS behaviour. Local automated tests are not a completed hosted staging trial.

After these pass and the merchant restriction is cleared, agree the cutover, update website A/CNAME records to the new host's exact values, and preserve Google MX/SPF/DKIM/DMARC records. Save the final origin, verify HTTPS and payment callbacks again, and only then open commissions and complete the launch checks. Keep the old deployment as rollback until the new host is proven.
