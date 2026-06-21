Zentrix Academy (frontend + optional backend)

Frontend: simple static site (index.html, styles.css, script.js).

Backend: Supabase only.

### Setup Supabase

1. **Create a Supabase project** at https://supabase.com

2. **Create the bookings table** in Supabase SQL Editor:

Copy and paste this exact SQL (including the closing parenthesis and semicolon):

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

Or use the multi-line format (make sure to include the closing `)` and `;`):

```sql
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

3. **Enable RLS (Row-Level Security)** and add policy:

Go to **Authentication → Policies** for the `bookings` table and add:

```sql
-- Allow public INSERT to bookings table
CREATE POLICY "Enable insert for all users" ON bookings
  FOR INSERT WITH CHECK (true);
```

Also grant the anon role SELECT privileges if you want the admin booking list to work from the frontend:

```sql
GRANT SELECT, INSERT ON public.bookings TO anon;
```

Or use the Supabase dashboard:
- Click on the `bookings` table
- Go to **RLS** section
- Click **Enable RLS**
- Add a new policy: `Enable insert for all users` with INSERT permission

4. **Get your Supabase credentials:**

- Go to **Project Settings → API**
- Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
- Copy your **anon public** key

5. **Add credentials to `index.html`:**

Open `index.html` and find the Supabase configuration script at the top of the file. Replace:

```html
<script>
  window.ZENTRIX_SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
  window.ZENTRIX_SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
</script>
```

With your actual Supabase URL and key.

The frontend now sends bookings directly to Supabase using the REST endpoint.

### Troubleshooting

If you see "Booking could not be saved to Supabase":

1. **Check browser console** (F12 → Console) for detailed error messages
2. **Verify RLS policies** allow public INSERT on the `bookings` table
3. **Check column names** match exactly: `name`, `course`, `dateText`, `selectedTime`, `phone`, `email`, `screenshot`
4. **Verify SELECT and INSERT grants**: Run `GRANT SELECT, INSERT ON public.bookings TO anon;` if you see permission denied errors
5. **Image size**: The frontend automatically compresses screenshots to ~800x600 at 60% JPEG quality before sending. If you still see `400 Bad Request`, try a smaller image file or reduce quality further.

Test with Postman or curl (note: use a small base64-encoded image):

```bash
curl -X POST "https://YOUR_PROJECT_ID.supabase.co/rest/v1/bookings" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","course":"HTML","dateText":"Jun 21, 2026","selectedTime":"10:00 AM","phone":"1234567890","email":"test@example.com","screenshot":"data:image/jpeg;base64,/9j/4AAQSkZJRg..."}'
```

Netlify deployment (frontend only):

1. Add this repo to Netlify.
2. Set the publish directory to the project root (`.`).
3. If your backend is hosted elsewhere, edit `netlify.toml` and set the backend URL:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://YOUR_BACKEND_URL_HERE/:splat"
  status = 200
  force = true
```

Vercel deployment (frontend only):

1. Add this repo to Vercel.
2. Deploy the `main` branch.
3. If your backend is hosted elsewhere, add a `vercel.json` file or set `window.ZENTRIX_API_BASE` in `index.html`.

Example `vercel.json` for backend rewrites:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://YOUR_BACKEND_URL_HERE/api/:path*"
    }
  ]
}
```

Example `index.html` override:

```html
<script>
  window.ZENTRIX_API_BASE = 'https://your-backend.example.com';
</script>
```

Because the backend is a simple Express server, it is easiest to deploy it separately on a Node host and then point the frontend to that backend.

Security note: This server uses a hard-coded passphrase and file-based storage for demo purposes only. For production, use proper authentication and a database.