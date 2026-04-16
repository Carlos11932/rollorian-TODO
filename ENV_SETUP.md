# Environment Setup

Create `.env.local` with these variables:

```env
# Database (PostgreSQL — Neon, Supabase, Railway, etc.)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@host/db?sslmode=require"

# NextAuth — generate secret with: openssl rand -base64 32
AUTH_SECRET="replace-with-random-secret"
AUTH_GOOGLE_ID="from-google-cloud-console"
AUTH_GOOGLE_SECRET="from-google-cloud-console"

# Optional: restrict login to specific emails (comma-separated)
ALLOWED_EMAILS="tu@gmail.com,pareja@gmail.com"
```

## Google OAuth Setup
1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
4. For local dev: `http://localhost:3000/api/auth/callback/google`

## Deploy Steps
1. Add env vars to Vercel
2. Run: `npx prisma migrate deploy`
3. Both users sign in with Google
4. Run: `USER_1_EMAIL=tu@gmail.com USER_2_EMAIL=pareja@gmail.com npx prisma db seed`
