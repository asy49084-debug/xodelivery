# XO Delivery - Phase 1
See the chat for step-by-step setup. Quick version:
1. Supabase: create project, SQL Editor, paste supabase/schema.sql, Run.
2. Copy Project URL + anon key into Vercel environment variables (see .env.example).
3. Upload this folder to GitHub, import it in Vercel, Deploy.
4. Register in the app, then in Supabase SQL Editor run:
   update users set role = 'admin' where id = (select id from auth.users where email = 'YOUR@EMAIL');
