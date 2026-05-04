# Configurable 3D Source Gear — Setup

## Files in this bundle

```
team-store/
  index.html                       ← the public site
  netlify.toml                     ← Netlify config
  netlify/
    functions/
      products.js                  ← serverless function that talks to Notion
  products-import.csv              ← all 19 products, ready to import to Notion
```

You won't need an `images/` folder anymore. Mockups now live in Notion.

---

## Setup, in order

### 1. Import the CSV into Notion

1. Open your Notion database
2. Click the `...` menu (top right) → **Merge with CSV**
3. Pick `products-import.csv`
4. Notion will fill in the 19 rows with everything except images

### 2. Upload mockup images to each row

For each row in your Notion DB:
1. Click the row to open it
2. Click into the **Image** cell
3. Drag the matching mockup PNG from your local `images/` folder
4. Notion uploads it and stores a URL automatically

This part is one-time grunt work. Maybe 15 minutes for 18 images (one product has no mockup yet — the Oversized Heavyweight Sweatshirt with no Printful URL).

Tip: open the row in side-peek view (single-click instead of full open) and you can drop images faster.

### 3. Push to GitHub

1. Create a new repo on github.com (e.g., `team-store`)
2. Drag your `team-store/` folder contents into the web upload, or push via git:
   ```
   cd team-store
   git init
   git add .
   git commit -m "Initial team store"
   git remote add origin https://github.com/YOUR-USERNAME/team-store.git
   git push -u origin main
   ```

### 4. Deploy to Netlify

1. Go to **app.netlify.com** and sign in (use GitHub OAuth, easiest)
2. Click **Add new site → Import an existing project**
3. Pick GitHub, find your repo
4. Build settings: leave everything default, just click **Deploy site**
5. Wait ~30 seconds for first deploy
6. You'll get a URL like `https://wonderful-name-abc123.netlify.app`

### 5. Set environment variables

This is the critical step that connects Netlify to your Notion database.

1. In Netlify dashboard: **Site configuration → Environment variables**
2. Click **Add a variable** for each of these:

   | Key | Value |
   |---|---|
   | `NOTION_KEY` | Your Notion integration secret (starts with `secret_` or `ntn_`) |
   | `NOTION_DATABASE_ID` | `356e382585b480989ba7d2584b3e7e6c` |

3. After adding, go to **Deploys** tab → **Trigger deploy → Deploy site** to rebuild with the new env vars

### 6. Test it

1. Visit your Netlify URL
2. You should see the products loading from Notion
3. The "Edit in Notion" link in the header opens your DB

---

## Updating the site

To add/edit/delete a product:
1. Open Notion, edit the row (or add a new one with `Active = Yes`)
2. Wait up to 5 minutes (CDN cache) — or hit the page with `?bust=1` for instant
3. That's it. No re-deploy, no file uploads, no commits

To hide a product temporarily without deleting:
- Set its **Active** checkbox to off in Notion

---

## Local development (optional)

If you want to test changes without deploying:

```
npm install -g netlify-cli
cd team-store
netlify dev
```

This runs the site locally with the serverless function working. You'll need to either:
- Run `netlify link` first to pull env vars from your live site
- Or create a `.env` file (gitignored) with `NOTION_KEY=...` and `NOTION_DATABASE_ID=...`

---

## Troubleshooting

**"Could not load products" error on the live site**
- Most likely cause: env vars not set, or you deployed before adding them
- Fix: add env vars in Netlify dashboard, trigger a re-deploy

**Products show but images are missing**
- The Image cells in Notion are empty for those rows
- Or: Notion file URLs expire after ~1 hour. The Netlify function fetches fresh URLs on each call so this shouldn't bite you, but if it does, the 5-min cache might be serving stale URLs. Wait 5 min or trigger a re-deploy.

**A new product I added doesn't show up**
- Check that the **Active** checkbox is on
- Wait up to 5 minutes for the CDN cache, or hard-refresh with Ctrl+Shift+R

**Want to clear cache instantly**
- Go to Netlify dashboard → Deploys → "Clear cache and deploy site"
