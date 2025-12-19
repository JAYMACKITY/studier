# Environment Variables Setup Guide

## Important: Where to Put Your Keys

### Stripe Secret Key → Vercel (NOT Supabase)

Your Stripe secret key **must** be in **Vercel's environment variables**, not Supabase.

**Why?** Your API routes (`api/create-checkout-session.js`, `api/verify-session.js`, `api/cancel-subscription.js`) are **Vercel Serverless Functions** that run on Vercel's servers. They need access to `process.env.STRIPE_SECRET_KEY` which Vercel provides.

## Step-by-Step Setup

### 1. Add Stripe Secret Key to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **studier** project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: Your Stripe secret key (starts with `sk_`)
   - **Environments**: Select all (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** your project (or wait for auto-deploy)

### 2. Supabase Setup (For Database - Optional but Recommended)

If you're setting up Supabase for your database, you'll need:

1. **Supabase Project URL** → Add to Vercel as `SUPABASE_URL`
2. **Supabase Anon Key** → Add to Vercel as `SUPABASE_ANON_KEY`
3. **Supabase Service Role Key** → Add to Vercel as `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)

These go in **Vercel**, not Supabase secrets, because your API routes need them.

## Current Architecture

```
┌─────────────────┐
│   Frontend      │ (HTML/JS files)
│   (Vercel)      │
└────────┬────────┘
         │
         │ API calls
         ▼
┌─────────────────┐
│  API Routes     │ (Vercel Serverless Functions)
│  /api/*         │ Need: STRIPE_SECRET_KEY from Vercel
└────────┬────────┘
         │
         ├──► Stripe API (uses STRIPE_SECRET_KEY)
         │
         └──► Supabase (if configured, uses SUPABASE_* keys)
```

## Summary

- ✅ **Stripe Secret Key** → Vercel Environment Variables
- ✅ **Supabase Keys** → Vercel Environment Variables (if using Supabase)
- ❌ **NOT** in Supabase Secrets (those are for Supabase Edge Functions, not Vercel)

## Testing

After adding `STRIPE_SECRET_KEY` to Vercel:
1. Wait for redeploy (or manually redeploy)
2. Try clicking "Start Free Trial" on your pricing page
3. It should redirect to Stripe checkout (not show an error)

## Need Help?

Contact: hello@studier.me

