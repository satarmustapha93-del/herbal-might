# Herbal Might

A mature, mobile-first apothecary storefront for natural herbs, roots and leaves. The Vite app runs in demo mode with sample products before Supabase is configured. Add Supabase credentials to enable sign-up, Google login, persistent products, orders, admin tools and image uploads. Checkout is mock-only and never charges a card.

## Run locally

Install Node.js 20 or newer. Open a terminal in the `frontend` folder and run:

```bash
npm install
npm run dev
```

Open the local URL Vite prints (normally `http://localhost:5173`). No `.env` is needed to preview the demo catalog. To use the database and auth, copy `.env.example` to `.env`, then replace the Supabase placeholders:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Keep the `VITE_WHATSAPP_URL`, `VITE_TIKTOK_URL` and `VITE_FACEBOOK_URL` entries from the example (or replace them with the shop’s links), save `.env`, and restart Vite. The anon/publishable key is safe to use in a browser because table and storage access is restricted by the RLS policies below. Never put a service-role key in a `VITE_` variable.

## 1. Create Supabase project and database

1. Visit [supabase.com](https://supabase.com), create an account and choose **New project**. Save the database password somewhere safe.
2. When the project is ready, open **Project Settings → API** (or **Data API**). Copy the Project URL and the public `anon`/publishable key. Put them in `frontend/.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never put the service-role key in frontend env.
3. In the project, select **SQL Editor → New query**. Open `supabase/schema.sql` from this repository, copy all of it into the SQL editor and press **Run**. This creates `profiles`, `products`, and `orders`, profile-on-signup trigger, admin helper, RLS policies and Storage policies.
4. Public visitors can read products. Customers can create/read their own orders and read their own profile. Only admins can change products, see all orders or upload/delete catalog pictures. Role changes are made from the Supabase SQL editor, never from the browser.

## 2. Create product image bucket

1. In Supabase open **Storage → New bucket**.
2. Name it exactly `product-images`, turn **Public bucket** on, and create it.
3. The SQL policies allow public image reads and restrict uploads, edits and deletes to authenticated admins. Admin uploads in `/admin` use this bucket automatically.

## 3. Enable email/password and Google login

### Email/password

In **Authentication → Sign In / Providers**, ensure **Email** is enabled. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:5173` while developing and add `http://localhost:5173/**` to Redirect URLs. For deployment, also add the production URL. The SQL signup trigger creates a user profile with role `user` automatically.

### Google OAuth

1. Visit [Google Cloud Console](https://console.cloud.google.com/) and create or select a Google Cloud project.
2. Open **Google Auth Platform** (or **APIs & Services → OAuth consent screen**), configure the app name and support email, and add developer/test users if the app remains in testing mode.
3. Open **Clients / Credentials → Create OAuth client ID → Web application**.
4. Add your website origins under **Authorized JavaScript origins** (for local development use `http://localhost:5173`).
5. Add this exact **Authorized redirect URI**: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`. Replace `YOUR_PROJECT` with the project reference from the Supabase URL.
6. Copy the Google Client ID and Client Secret into Supabase **Authentication → Sign In / Providers → Google** and enable the provider. Supabase, not the React app, handles the OAuth callback.
7. Test from the **Sign in** page. Configure the production domain in Google and Supabase URL settings before launch.

## 4. Promote your account to admin

1. Sign up once in the app with your own email or Google account.
2. In Supabase **SQL Editor**, run this query with your sign-in email:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

3. Sign out and sign in again, then visit `/admin`. Admin can add, edit, and delete products, upload product images, adjust prices and stock, and review/update order status. Never expose the Supabase service-role key to make yourself admin.

## 5. Configure Mailgun order emails

1. Create a [Mailgun](https://www.mailgun.com/) account. Add a sending domain and complete its DNS verification, or use the sandbox domain for testing.
2. Copy the private API key and sending domain. For sandbox sending, add and verify your own email under **Sending → Domains → Authorized Recipients**.
3. Install the Supabase CLI and sign in, then link this project from the repository root:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase secrets set MAILGUN_API_KEY=key-... MAILGUN_DOMAIN=mg.example.com MAILGUN_FROM="Herbal Might <orders@mg.example.com>"
npx supabase functions deploy send-order-confirmation
```

The Edge Function authenticates the caller, verifies the caller owns the order (or is admin), reads the order using the server-only service role, and sends a branded order summary through Mailgun. It never sends the service key to the browser. After creating an order, the checkout page invokes `send-order-confirmation`.

## 6. Social and contact links

Edit `frontend/.env` to set `VITE_WHATSAPP_URL`, `VITE_TIKTOK_URL` and `VITE_FACEBOOK_URL`; the supplied example contains the Herbal Might contact links currently provided. Restart the Vite server after changing frontend variables. The top WhatsApp banner appears at each new page load and can be dismissed for that visit; the footer repeats WhatsApp and social links.

## Demo products and checkout

The demo catalog includes Moringa Leaf, Ashwagandha Root, Neem Leaves, Ginger Root, Zobo (Hibiscus), Turmeric Powder, Moringa Powder, Fennel Seeds, Licorice Root, Clove Buds, Moringa Seeds and Peppermint Leaves. Demo prices are sample naira prices. Products come from Supabase when configured, otherwise the sample catalog is used locally. The product detail page and each cart row have quantity controls; a single checkout can include several different products with their selected quantities.

Checkout saves an order with `pending` status and displays a mock payment handoff. `src/lib/payment.js` is the provider hook. Implement Paystack or Flutterwave there with a server-side transaction initialization and verified webhook before accepting real money; do not trust a client-calculated amount or the mock status as proof of payment.

## Deploy

Deploy the `frontend` folder to Vercel or Netlify using the Vite preset and set the three `VITE_*` Supabase values plus the social links in the host’s environment settings. Add the production origin in Supabase **Authentication → URL Configuration** and in Google’s allowed origins. Deploy the Supabase schema and Edge Function from the same Supabase project. Never commit `.env` or Mailgun secrets.

## Project layout

```text
frontend/src/components/   TopBanner, Navbar, ProductCard, Footer
frontend/src/pages/        Home, Shop, ProductDetail, Cart, Checkout, About, Contact, Admin, Login
frontend/src/context/      AuthContext, CartContext
frontend/src/lib/          Supabase client and payment-provider hook
supabase/schema.sql        Tables, triggers, RLS and Storage policies
supabase/functions/        Mailgun order-confirmation Edge Function
```

## Backend folder

The ackend/ folder explains the backend layout. This version is Supabase-backed, so the deployable database and Edge Function sources remain in supabase/ for compatibility with the Supabase CLI; there is no separate FastAPI service.

