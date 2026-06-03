# InCrowd — Frontend (React + Vite + Tailwind)

Riscrittura del frontend InCrowd nel design **"Editoriale"**, costruita in parallelo
al vecchio frontend Vue (`../frontend`). Quando completa, sostituirà `../frontend`.

## Stack
- **React 19 + Vite + TypeScript**
- **Tailwind CSS** (v3) — i token/temi sono guidati da CSS custom properties in
  `src/styles/theme.css`; `tailwind.config.ts` le mappa su utility theme-aware.
- **Zustand** per lo stato (`userStore`, `followStore`)
- **react-router-dom v7** con guard equivalenti a quelli del router Vue
- Font **self-hosted** via `@fontsource` (Bricolage Grotesque, Figtree, JetBrains Mono)

## Avvio
```bash
cp .env.example .env   # imposta VITE_BACKEND_URL sull'URL del backend
npm install
npm run dev            # http://localhost:5173
```

## Script
- `npm run dev` — dev server
- `npm run build` — type-check (`tsc -b`) + build di produzione
- `npm run lint` — ESLint
- `npm run preview` — anteprima della build

## Variabili d'ambiente
- `VITE_BACKEND_URL` — base URL delle REST API (es. `http://localhost:3000`).
  È la stessa variabile usata dal layer `src/api/*` (portato dal frontend Vue).
- `VITE_GOOGLE_CLIENT_ID` — usato per Google OAuth nella fase Auth.

## Stato del lavoro
- **Fase 0** (scaffold) e **Fase 1** (design system + Navbar + Home/Feed) completate.
- Le altre schermate (dettaglio proposta, profili, wizard creazione, pannelli
  operatore/admin, auth) sono pagine **placeholder** e arriveranno nelle fasi successive.

## Struttura
```
src/
  api/         # client REST (fetch) — port dal frontend Vue
  components/  # Navbar, ProposalCard, Layout, ui/ (design system)
  config/      # mappa categorie
  hooks/       # useAuthor (risoluzione autore con cache)
  lib/         # theme (auto/light/dark)
  pages/       # Home, Placeholder
  services/    # UserService, PropostaService, FollowService, DateService
  stores/      # Zustand: userStore, followStore
  styles/      # theme.css (token + temi dal prototipo)
  types/       # tipi di dominio
  utils/       # image, passwordValidator
  router.tsx   # rotte + guard
```
