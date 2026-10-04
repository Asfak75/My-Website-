# Personal Service Website

A lightweight, English-only personal service website using HTML, CSS, JavaScript and Supabase, designed for free Netlify deployment.

## Features

- Responsive public homepage
- Dynamic service list from Supabase
- WhatsApp "Order Now" links
- Supabase email/password authentication
- Admin-only dashboard
- Add, edit, enable/disable and delete services
- Configurable WhatsApp number
- PostgreSQL + Row Level Security
- No service-role key in frontend
- No customer accounts, payments, carts or image uploads

## 1. Create Supabase project

1. Create a project at https://supabase.com/
2. Open **SQL Editor**.
3. Paste all of `supabase.sql`.
4. Run it successfully.

## 2. Create the first admin

1. Open **Authentication → Users** in Supabase.
2. Create a user with the admin email and password you want to use.
3. Copy that user's UUID.
4. In SQL Editor run:

```sql
insert into public.admin_users (user_id)
values ('PASTE_AUTH_USER_UUID_HERE')
on conflict do nothing;
```

Do not put the password in `admin_users`. Supabase Auth handles passwords securely.

## 3. Connect the frontend

This project uses only the Supabase browser-safe public/anon key.

For local testing, copy `js/config.example.js` to `js/config.js` and replace the two values.

For Netlify, do NOT commit `js/config.js`. Netlify generates it during the build from environment variables.

Get the values from Supabase **Project Settings → API**:
- Project URL → `SUPABASE_URL`
- Publishable key / anon key → `SUPABASE_ANON_KEY`

Use the public browser key only. Never use a service-role/secret key.

## 4. Test locally

A local web server is recommended because ES modules should not be opened directly as a `file://` page.

With Node.js installed:

```bash
npm install
npm run build
```

Then serve the folder with any static server.

## 5. GitHub

Create a new GitHub repository and upload the project files.

Do not upload `js/config.js`.

## 6. Netlify

1. Log in to Netlify.
2. Add a new site from Git.
3. Select the GitHub repository.
4. Netlify will read `netlify.toml`.
5. Build command: `node netlify/build.mjs`
6. Publish directory: `.`
7. Deploy.

## 7. Netlify environment variables

Open your Netlify site:

**Project configuration → Environment variables**

Add:

- `SUPABASE_URL` = your Supabase project URL
- `SUPABASE_ANON_KEY` = your Supabase publishable/anon key

Then trigger a new deploy.

The build creates `js/config.js` automatically. The values are intended to be public browser configuration; Supabase RLS is what protects the database.

## 8. Supabase Auth URL settings

In Supabase, open **Authentication → URL Configuration**.

Set:
- Site URL = your Netlify site URL
- Add your Netlify URL to Redirect URLs if needed.

This project uses email/password login and does not require a password-reset page.

## 9. Test admin login

1. Open your Netlify site's `login.html`.
2. Enter the Auth user's email/password.
3. The app checks `is_admin()`.
4. Authorized users are sent to `dashboard.html`.
5. Unauthorized authenticated users are signed out and denied.
6. Test Logout and confirm it returns to Login.

## 10. Add a service

From the dashboard:
1. Click **Add Service**.
2. Enter the service name.
3. Choose Active or Disabled.
4. Set the display order.
5. Save.

Active services immediately appear on the homepage.

## Security notes

- Passwords are managed by Supabase Auth, not by this website.
- The service-role key must never be used in browser code.
- Public visitors can read only active services and the WhatsApp setting.
- Only UUIDs listed in `admin_users` can manage services/settings.
- Client-side validation improves UX; database constraints and RLS enforce security.
- The `admin_users` table has no direct client read/write access.

## Files

- `index.html` — public homepage
- `login.html` — admin login
- `dashboard.html` — admin dashboard
- `css/style.css` — responsive styling
- `js/supabase.js` — Supabase client
- `js/app.js` — public service rendering and WhatsApp links
- `js/auth.js` — login/session handling
- `js/dashboard.js` — admin CRUD/settings
- `js/config.example.js` — configuration example
- `netlify/build.mjs` — creates `js/config.js` from Netlify variables
- `netlify.toml` — Netlify build configuration
- `supabase.sql` — database schema, seed data and RLS
