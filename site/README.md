# Take Command site

Public site and admin panel for Victor Simz | Take Command. It lives in the `site/` folder so the existing 7BD Command Center app at the repo root is untouched.

## What is here

- **Home page** (`/`): the Take Command landing page, featuring the first published resource.
- **Free resources** (`/resources`) and one page per resource (`/resources/<web-address>`), all built from the same template.
- **Sign-up**: the form records the subscriber, emails a private download link through Resend, and adds the person to Resend contacts.
- **Admin panel** (`/admin`): overview dashboard (visits, visitors, sign-ups, downloads, sign-up rate), resource management with PDF and cover uploads, subscriber list and CSV export.
- **Analytics**: first-party page counts with no cookies. Visitors are counted per day from a salted hash that changes daily; IP addresses are not stored.

Stack: Next.js (App Router), Supabase (Postgres, Auth, Storage), Resend.

## Set up

1. **Supabase**
   - Run `supabase/migrations/0001_take_command.sql`, then `0002_take_command_storage.sql`, in the project's SQL editor. All tables are prefixed `tc_` and have row level security on with no public policies; the site reads and writes through the server only.
   - In Authentication, add a user with your email and a password. Only emails listed in `ADMIN_EMAILS` can sign in to `/admin`.
2. **Resend**
   - Verify the sending domain and create an API key.
3. **Environment variables**
   - Copy `.env.example` to `.env.local` for local work, and add the same values in Vercel. Never commit real keys.
4. **Vercel**
   - Import the repo and set the project's Root Directory to `site`.
5. **First resource**
   - Sign in at `/admin`, open The Commander's Life Audit under Resources and upload the PDF. Sign-up stays off for a resource until its PDF is uploaded.

## Local development

```bash
npm install
npm run dev
```

Without Supabase keys the public pages still render, using the starter content in `lib/seed.ts`; sign-up and the admin panel need the keys.

## Adding a resource

Admin > Resources > Add a resource. Fill in the title, web address, description and the "What's inside" lines, upload the PDF and a cover image, then set the status:

- **Draft**: hidden.
- **Coming soon**: listed on Free resources without a sign-up.
- **Published**: listed, with its own page and sign-up form.

The published resource with the lowest order number is featured on the home page.
