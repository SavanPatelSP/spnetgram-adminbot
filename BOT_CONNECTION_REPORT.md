# Bot Connection Report

| Field | Value |
|-------|-------|
| **Bot Username** | *Could not resolve — API unreachable* |
| **Bot ID** | *Could not resolve — API unreachable* |
| **Connection Mode** | Polling (configured; no webhook set) |
| **Startup Status** | ❌ Blocked — network connectivity issue |

## Details

### Polling vs Webhook
The bot is configured for **polling mode**. `bot.launch()` is called in `src/bot/bot.ts:39` with no webhook configuration. No webhook URL is set anywhere in the codebase. When tested, `getWebhookInfo()` would confirm no webhook is registered.

### Connectivity Test
Direct API calls to `api.telegram.org` (149.154.166.110:443) **time out** from this machine:

| Test | Result |
|------|--------|
| DNS resolution | ✅ Resolves to 149.154.166.110 |
| TCP handshake (443) | ❌ Connection timeout after 10s |
| ICMP ping | ❌ 100% packet loss |
| `bot.telegram.getMe()` via Telegraf | ❌ Timeout |

### Token Validation
The token format is valid (numeric bot ID + colon + alphanumeric key). The token itself could not be verified because the Telegram API is unreachable from the current network.

## Configuration Issues Found

| # | Issue | File | Severity |
|---|-------|------|----------|
| 1 | `BOT_TOKEN` defaulted to `""` (empty) | `src/infrastructure/config/env.ts:8` | ✅ **Fixed** — now required via `z.string().min(1)` |
| 2 | `notifications.service.ts` read `process.env.TELEGRAM_BOT_TOKEN` (wrong var name) instead of `env.BOT_TOKEN` | `src/modules/notifications/notifications.service.ts:103` | ✅ **Fixed** — now reads `env.BOT_TOKEN` |
| 3 | `startBot()` silently returned when token was empty instead of throwing | `src/bot/bot.ts:34-36` | ✅ **Fixed** — now throws `Error` |
| 4 | `.env.example` had placeholder text but no indication token was required | `.env.example` | ✅ **Fixed** — updated comment |

## Files Changed

| File | Change |
|------|--------|
| `src/infrastructure/config/env.ts` | `BOT_TOKEN`: removed default `""`, added `.min(1)` validation |
| `src/modules/notifications/notifications.service.ts` | Added `env` import; replaced `process.env.TELEGRAM_BOT_TOKEN` with `env.BOT_TOKEN` |
| `src/bot/bot.ts` | `startBot()` now throws if `BOT_TOKEN` is missing instead of silently returning |
| `src/vitest.setup.ts` | Added `process.env.BOT_TOKEN` fallback for test environment |
| `.env` | Updated with provided token (gitignored) |
| `.env.example` | Updated comment to indicate `BOT_TOKEN` is required with no default |

## Remaining Blocker Before Live Testing

**Network connectivity**: This machine cannot reach `api.telegram.org` (149.154.166.110). The firewall or network policy is blocking outbound connections to Telegram.

To resolve:
- Verify the bot token on a machine with Telegram API access
- Run `curl -s "https://api.telegram.org/bot<token>/getMe"` from a non-blocked network
- Expected response: `{"ok":true,"result":{"id":...,"is_bot":true,"first_name":"...","username":"..."}}`
- Once the network allows outbound, restart the app via `npm start` or `npm run dev`
