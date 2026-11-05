# Heartfold Ink migration

This repository contains the saved website source and an independent Node.js/Docker edition under `portable/`. The independent edition supports guest ordering, optional email-verified customer accounts and separate owner password authentication, without ChatGPT sign-in.

## Current status

This is source preparation, not a deployed or launch-ready shop. The current portable database is SQLite. PostgreSQL on db-01 is the agreed deployment target and is not implemented yet. The app is intended to run on web-01 behind Cloudflare Tunnel. Server access and Cloudflare configuration remain to be connected and verified.

Start with `portable/DEPLOYMENT.md`. Do not deploy the original Sites authentication code directly on a general web server. The portable build replaces it.

Private credentials, customer data, runtime databases, uploads and the Sites hosting identity are excluded from this transfer. Keep runtime secrets outside Git. Stripe payments must remain disabled until the account restriction is cleared and end-to-end staging tests pass. Email verification requires configured and tested transactional sending.
