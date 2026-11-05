# Heartfold Ink migration

The independent Node.js/Docker edition is under `portable/`. It supports guest ordering, optional email-verified accounts and separate owner password authentication without ChatGPT login.

This is source preparation, not a deployed or launch-ready shop. The portable edition currently uses SQLite. PostgreSQL on db-01 is the agreed target and is not implemented yet. The planned app host is web-01 behind Cloudflare Tunnel; server and Cloudflare access remain to be connected.

Read portable/DEPLOYMENT.md. Do not deploy the original Sites authentication directly on a general web server. The portable build replaces it.

Secrets, customer data, uploads and Sites hosting identity are excluded. Keep runtime secrets outside Git. Stripe payments remain disabled until account restrictions are cleared and staging tests pass. Transactional email must be configured and tested.
