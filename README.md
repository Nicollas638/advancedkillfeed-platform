# AdvancedKillFeed Font Manager

Custom Fonts for **AdvancedKillFeed** – create, upload and edit custom fonts for your Unturned killfeeds.

This project is a web-based **font manager/editor** for the AdvancedKillFeed plugin.  
It focuses on the web dashboard: users can sign in with Discord, create and manage their fonts, and see them in a live preview and in a community fonts grid.  
It is part of the **RedstonePlugins** ecosystem.


> **Status:** Work in progress / not actively maintained.  
> Published as a portfolio project.

---

## ✨ Features

- 🔐 **Discord OAuth login** using NextAuth (Discord provider)
- 🧩 **Font management dashboard**
    - Create new fonts
    - Edit font metadata (name, sample text, author, visibility, etc.)
    - Track glyph count per font
- 🖼️ **Live preview**
    - Sample text preview using the selected font
    - Killfeed-style header so users can see how it might look ingame
- 🌍 **Community Fonts section**
    - Grid of community fonts with search input
    - Font cards showing name, glyph count, author and creation date
- 🎨 **Modern UI with Tailwind CSS**
    - Dark theme
    - Responsive layout
- 🧪 **Glyph manager (WIP)**
    - UI prepared to manage glyphs of a font directly from the browser

> **Note:** The current implementation covers the web font manager/editor.  
> Export and direct integration with the AdvancedKillFeed plugin were planned as a later phase and are **not implemented
yet**.

---

## 🏗️ Tech Stack

- **Framework:** Next.js 13+ (React, App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js with Discord provider
- **Database/ORM:** Prisma
- **Runtime / Target:** Node.js (Vercel / custom VPS)

---

## 📦 Next.js setup

This project is built with **Next.js 13+** using:

- The **App Router** under `src/app` for all pages and layouts.
- Classic **Pages API routes** under `src/pages/api` for NextAuth and font endpoints.

The project was originally created with `create-next-app` and then adapted to use:

- TypeScript
- Tailwind CSS
- Prisma
- NextAuth (Discord provider)

---

## 📂 Project Structure

```txt
.
├─ prisma/
│  └─ schema.prisma         # Database schema and Prisma models
├─ public/
│  └─ ...                   # Static assets (icons, images, etc.)
└─ src/
   ├─ app/                  # Next.js App Router (main UI)
   │  ├─ fonts/
   │  │  ├─ [id]/           # Font detail page (view/manage a single font)
   │  │  └─ new/            # Create new font flow
   │  ├─ favicon.ico
   │  ├─ globals.css        # Global Tailwind styles
   │  ├─ layout.tsx         # Root layout (theme, providers, etc.)
   │  ├─ page.tsx           # Landing page (hero, community fonts)
   │  └─ providers.tsx      # Global providers (theme, auth, etc.)
   │
   ├─ components/
   │  ├─ Button.tsx         # Reusable button component
   │  ├─ Card.tsx           # Generic card used across the UI
   │  ├─ ClientLayout.tsx   # Layout wrapper for client-side sections
   │  ├─ FontCard.tsx       # Card used in the Community Fonts grid
   │  ├─ Footer.tsx
   │  ├─ GlyphManager.tsx   # (WIP) UI to manage glyphs of a font
   │  ├─ Logo.tsx
   │  ├─ Navbar.tsx
   │  ├─ Navigation.tsx
   │  ├─ PageContainer.tsx  # Shared page layout container
   │  ├─ SectionHeading.tsx # Section titles/subtitles
   │  ├─ SignInButton.tsx   # “Sign in with Discord” button
   │  ├─ ThemeToggle.tsx    # Light/Dark theme switch
   │  └─ UserMenu.tsx       # User dropdown when logged in
   │
   ├─ config/
   │  └─ next-auth.ts       # NextAuth configuration (Discord provider)
   │
   ├─ context/
   │  └─ AuthContext.tsx    # Auth context to expose user/session across the app
   │
   ├─ hooks/
   │  └─ useFonts.ts        # Custom hook to fetch and manage fonts data
   │
   ├─ lib/
   │  └─ ...                # Utilities / shared logic (e.g. Prisma client)
   │
   └─ pages/
      └─ api/
         ├─ auth/
         │  └─ [...nextauth].ts   # NextAuth API route
         └─ fonts/
            └─ [id]/...           # REST-like API for fonts (CRUD, WIP)
```

---

## 🧠 Implementation details

- Uses **Next.js App Router** for the UI and **Pages API routes** for authentication and font endpoints.
- Authentication is handled via **NextAuth** with a **Discord provider**, configured in `src/config/next-auth.ts` and
  exposed through `src/pages/api/auth/[...nextauth].ts`.
- Global authentication state is shared through `AuthContext`, so components like `Navbar`, `UserMenu` and
  `SignInButton` can react to the current user.
- Font data is accessed using the custom hook `useFonts`, which centralises fetching, caching and mutations for fonts.
- UI is built from reusable React components (`FontCard`, `GlyphManager`, `PageContainer`, `SectionHeading`, etc.) and
  styled with **Tailwind CSS**.

---

## 📸 Screenshots / Showcase

All screenshots are stored under `docs/screenshots/`.

### Landing page (logged out)

![Landing page (logged out)](docs/screenshots/img.png)

### Landing page (logged in, with actions)

![Landing page (logged in)](docs/screenshots/img_1.png)

### Fonts listing / All Fonts

![All Fonts](docs/screenshots/img_2.png)

### New Font – upload images

![New Font](docs/screenshots/img_3.png)

### Font detail – preview & glyph grid

![Font Detail](docs/screenshots/img_4.png)

### Glyph details modal

![Glyph Details](docs/screenshots/img_5.png)

### Add New Glyph modal

![Add New Glyph](docs/screenshots/img_6.png)


--- 

## 📋 Requirements

- Node.js 18+
- npm / pnpm / yarn
- A PostgreSQL (or compatible) database for Prisma

---

## 🚀 Getting Started

```bash
 git clone https://github.com/educatalan02/advancedkillfeed-platform.git
cd advanced-killfeed-font-manager
pnpm install  
```

Create a .env file with your configuration:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/akf-fonts"
NEXTAUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

```

---

## 📋 Roadmap / Original idea

- [x] User authentication with Discord OAuth
- [x] Font management dashboard (list, create, edit fonts)
- [x] Live preview of fonts with sample text and killfeed header
- [x] Community Fonts section with search/filter
- [x] Responsive UI with Tailwind CSS
- [x] Glyph manager UI (WIP)
- [x] Database schema and Prisma models for users, fonts, glyphs
- [x] NextAuth.js setup with Discord provider
- [ ] Finish glyph editor UI
- [ ] Implement font import/export format
- [ ] Expose API endpoints for the AdvancedKillFeed plugin
- [ ] Admin tools and moderation for public/community fonts
- [ ] Improve documentation and add more examples


## 🧑‍💻 Author

Built by **Eduardo Catalán (@educatalan02)**  
Part of the **RedstonePlugins** ecosystem and the **AdvancedKillFeed** project.


## 📝 License

This project is licensed under the **MIT License**.

