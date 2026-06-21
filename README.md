Zentrix Academy (frontend + optional backend)

Frontend: simple static site (index.html, styles.css, script.js).

Backend: Supabase only.

1. Create a Supabase project.
2. Create a `bookings` table with columns:
   - `id` (bigint, primary key, auto-increment)
   - `name` (text)
   - `course` (text)
   - `dateText` (text)
   - `selectedTime` (text)
   - `phone` (text)
   - `email` (text)
   - `bookingText` (text)
   - `screenshot` (text)
   - `createdAt` (timestamp)

3. Add your Supabase project settings in `index.html` or globally:

```html
<script>
  window.ZENTRIX_SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
  window.ZENTRIX_SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
</script>
```

The frontend now sends bookings directly to Supabase using the REST endpoint.

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