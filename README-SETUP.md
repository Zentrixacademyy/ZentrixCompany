# Zentrix Academy Setup Guide

## Overview

- **Frontend**: Static site (HTML/CSS/JS)
- **Backend**: Supabase (PostgreSQL + REST API)
- **Live**: https://zentrixacademy.github.io/ZentrixCompany/

## Setup Steps

### 1. Create Supabase Project

1. Go to https://supabase.com and sign up
2. Create a new project
3. Wait for the project to initialize

### 2. Create the Bookings Table

Copy this SQL and paste it into **Supabase SQL Editor**:

```sql
-- Exact table schema expected by the frontend (column names must match)
CREATE TABLE bookings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  course TEXT NOT NULL,
  dateText TEXT NOT NULL,
  selectedTime TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  screenshot TEXT NOT NULL
);
```

**Important**: Make sure you copy the entire line including the `)` at the end and the `;` at the very end.

### 3. Enable RLS (Row-Level Security) and Add Policy

Paste this into the SQL Editor:

```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow public inserts from the frontend (anon key). Only enable in development/test projects.
CREATE POLICY "Allow public insert" ON bookings FOR INSERT WITH CHECK (true);
```

### 4. Get Your Supabase Credentials

1. Go to **Project Settings → API** (gear icon)
2. Copy your **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy your **anon public** key

### 5. Configure the Frontend

1. Open `index.html` in the repo
2. Find this section near the end (before `<script src="script.js"></script>`):

```html
<script>
  window.ZENTRIX_SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
  window.ZENTRIX_SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
</script>
```

3. Replace `YOUR_PROJECT_ID.supabase.co` with your Project URL
4. Replace `YOUR_ANON_KEY` with your anon key
5. Save the file

### 6. Test the Booking Flow

1. Open the live site: https://zentrixacademy.github.io/ZentrixCompany/
2. Click "Book Demo"
3. Select a date → time → fill in details → upload a screenshot
4. Click "Confirm Booking"

If it works, you'll see a confirmation modal. Your booking should appear in Supabase (check **Table Editor → bookings**).

## Troubleshooting

### "Booking could not be saved to Supabase"

1. **Open browser console** (F12 → Console tab)
2. Look for detailed error messages
3. Common issues:
   - Supabase URL or key not set in `index.html`
   - Table name is not exactly `bookings`
   - RLS policy not created or wrong permissions
   - Column names don't match (must be exact: `name`, `course`, `dateText`, `selectedTime`, `phone`, `email`, `screenshot`)

### Permission denied on Supabase insert

If the browser shows `permission denied for table bookings`, run this in Supabase SQL Editor:

```sql
GRANT SELECT, INSERT ON public.bookings TO anon;
```

Also ensure Row-Level Security is enabled and the insert policy exists:

```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow public insert" ON bookings FOR INSERT WITH CHECK (true);
```

If the policy already exists, you can safely ignore that error and continue testing.

If the browser shows `Failed to fetch` or `ERR_INTERNET_DISCONNECTED`, confirm that:

- your machine has internet access,
- the browser is online,
- the Supabase URL configured in `index.html` is correct, and
- the site can reach `https://YOUR_PROJECT_ID.supabase.co`.

Then test again.

### Missing Supabase columns

If you see errors like `Could not find the 'course' column` or another missing column, run this in Supabase SQL Editor:

```sql
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS course TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS dateText TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS selectedTime TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS screenshot TEXT;
```

Then verify the table schema and test again.

### "Syntax error at or near ;"

Make sure you're copying the **entire** SQL statement including the closing `)` and ending `;`:

```sql
-- Exact table schema expected by the frontend (single-line format)
CREATE TABLE bookings (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, course TEXT NOT NULL, dateText TEXT NOT NULL, selectedTime TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL, screenshot TEXT NOT NULL, createdAt TIMESTAMP NOT NULL);
```

### Test with cURL

If you want to manually test the API:

```bash
curl -X POST "https://YOUR_PROJECT_ID.supabase.co/rest/v1/bookings" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "course": "HTML Fundamentals",
    "dateText": "Friday, June 21, 2026",
    "selectedTime": "10:00 AM",
    "phone": "+91 12345 67890",
    "email": "test@example.com",
    "screenshot": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

## Deployment

The frontend is already deployed to GitHub Pages. After you set up Supabase:

1. Update `index.html` with your Supabase credentials
2. Commit and push the changes
3. The site updates automatically in ~1-2 minutes

To deploy to other platforms (Netlify, Vercel, etc.), just upload this repo to your preferred host.
