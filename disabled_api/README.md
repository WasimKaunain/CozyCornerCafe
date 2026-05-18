# disabled_api

This folder contains inactive/archived serverless endpoints and feature files.

## Why this exists
Vercel Hobby plan limits the number of serverless functions. Only files directly under `app/api/*.ts` are deployed as serverless functions.

So, to free up function slots:
- move unused endpoints out of `app/api/` into here, or delete them.

## Notes
- Returning `410` from an endpoint does **not** reduce the function count. The file must be moved/deleted.
