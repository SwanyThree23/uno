# SeeWhy LIVE — Environment Variables Reference

## API Server (`apps/api/.env`)

### Server
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3001` | API server port |
| `APP_BASE_URL` | Yes | `http://localhost:3000` | Frontend base URL (for email links) |
| `API_BASE_URL` | Yes | `http://localhost:3001` | API base URL |

### Database
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |

**Format:** `postgresql://USER:PASSWORD@HOST:PORT/DBNAME`

### Redis
| Variable | Required | Description |
|----------|----------|-------------|
| `REDIS_URL` | ✅ | Redis connection string |

**Format:** `redis://HOST:PORT` or `redis://:PASSWORD@HOST:PORT`

### JWT Authentication
| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_PRIVATE_KEY_PATH` | ✅ | Path to RSA-4096 private key PEM file |
| `JWT_PUBLIC_KEY_PATH` | ✅ | Path to RSA-4096 public key PEM file |

**Generate keys:**
```bash
openssl genrsa -out keys/private.pem 4096
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

> Falls back to `COOKIE_SECRET` for HS256 if PEM files don't exist (dev only).

### Encryption
| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_SECRET` | ✅ | Exactly 32+ character string for AES-256-GCM |

**Generate:** `openssl rand -base64 32`

### VDO.Ninja / Streaming
| Variable | Required | Description |
|----------|----------|-------------|
| `VDO_NINJA_API_KEY` | No | VDO.Ninja API key (for managed rooms) |
| `VDO_NINJA_SALT` | ✅ | 64-char hex string for HMAC room ID generation |
| `MEDIAMTX_BASE` | No | MediaMTX proxy URL for RTMP ingestion |

**Generate salt:** `openssl rand -hex 32`

### Stripe
| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | ✅ | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | ✅ | From Stripe Dashboard webhooks — `whsec_...` |
| `STRIPE_PLATFORM_ACCOUNT_ID` | Yes | Your platform's Stripe account ID |
| `STRIPE_PRICE_BRONZE` | ✅ | Stripe Price ID for $1/mo subscription |
| `STRIPE_PRICE_SILVER` | ✅ | Stripe Price ID for $5/mo subscription |
| `STRIPE_PRICE_GOLD` | ✅ | Stripe Price ID for $15/mo subscription |

### AI (Anthropic)
| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | No | `sk-ant-...` — for AI moderation/transcription |

### Email (SMTP)
| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_HOST` | Yes | SMTP server host |
| `SMTP_PORT` | No | SMTP port (default: 587) |
| `SMTP_USER` | Yes | SMTP username / API token |
| `SMTP_PASS` | Yes | SMTP password / API token |
| `EMAIL_FROM` | No | From address (default: hello@seewhylive.com) |

**Recommended:** [Postmark](https://postmarkapp.com/) — set both user and pass to your API token.

### CORS & Security
| Variable | Required | Description |
|----------|----------|-------------|
| `CORS_ORIGIN` | Yes | Comma-separated list of allowed origins |
| `COOKIE_SECRET` | ✅ | 64-char hex random string |
| `HELMET_CSP` | No | `true` to enable strict CSP |

---

## Frontend (`apps/web/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Full API base URL (e.g. `https://api.seewhylive.com`) |
| `NEXT_PUBLIC_VDO_NINJA_URL` | No | VDO.Ninja base URL (default: `https://vdo.ninja`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | `pk_live_...` or `pk_test_...` |
| `NEXT_PUBLIC_APP_URL` | No | Frontend URL for meta tags |

---

## Security Notes

1. **Never commit `.env` files** to version control
2. Use secret managers (AWS Secrets Manager, HashiCorp Vault, or Doppler) in production
3. Rotate `ENCRYPTION_SECRET` will invalidate all stored stream keys — plan accordingly
4. `JWT_PRIVATE_KEY_PATH` file must be readable only by the process user (`chmod 600`)
5. `STRIPE_WEBHOOK_SECRET` must match your Stripe Dashboard endpoint exactly
