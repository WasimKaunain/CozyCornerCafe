# disabled_hobby

Vercel Hobby plan limits the number of serverless functions. Only files that are directly under `api/*.ts` are deployed as serverless functions.

Move endpoints you no longer need into this folder so they are not deployed.

## Voucher-drop endpoints (move to this folder if campaign is over)
- `voucher-create.ts`
- `voucher-qr.ts`
- `voucher-validate.ts`
- `voucher-redeem.ts`
- `voucher-init.ts`

## Admin console endpoints (keep only if you still use admin console)
- `admin-login.ts`
- `admin-console-login.ts`
- `admin-console-customers.ts`
- `admin-console-vouchers-claimed.ts`
- `admin-console-vouchers-redeemed.ts`
- `admin-console-stats.ts`

## Promo endpoints
- Keep `promo-validate.ts` only if you still want instant promo-applied UX.

## Already disabled (but still count as functions until moved)
These currently return `410`, but **they still count** towards the function limit while they live under `api/`:
- `promo-voucher-create.ts`
- `promo-voucher-validate.ts`
- `promo-voucher-redeem.ts`
