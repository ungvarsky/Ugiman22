# TrenerApp

Appka pre osobného trénera na správu klientov, zdieľaný kalendár tréningov,
rátanie odtrénovaných kreditov z balíčkov a evidenciu platieb. Responzívne
rozhranie funkčné na mobile aj desktope.

## Stack

- Next.js (App Router) + TypeScript
- PostgreSQL + Prisma
- NextAuth (Credentials provider, JWT sessions)
- Tailwind CSS

## Model appky

- Jeden **tréner** (rola `TRAINER`) spravuje všetkých svojich **klientov**
  (rola `CLIENT`), ktorí majú vlastné prihlásenie.
- Tréner klientovi vytvorí **balíček** tréningov (napr. "10 tréningov" za
  danú cenu). Balíček má `totalCredits` a `remainingCredits`.
- Pri naplánovaní tréningu môže tréner priradiť balíček. Keď tréning označí
  ako **odtrénovaný**, z priradeného balíčka sa odpočíta 1 kredit (a vráti
  sa späť, ak sa stav zmení naspäť).
- **Platby** sa evidujú ručne (hotovosť / prevod / karta / iné), voliteľne
  naviazané na konkrétny balíček.
- **Kalendár** je zdieľaný: tréner vidí a spravuje tréningy všetkých
  klientov, klient vidí len svoje vlastné (read-only, s prehľadom podľa dní).

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up PostgreSQL and copy `.env.example` to `.env`, filling in
   `DATABASE_URL` and a random `NEXTAUTH_SECRET`.

3. Run migrations and seed demo data:

   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

   This creates a trainer account and two demo clients (password
   `Password123!` for all):

   | Email | Role |
   |---|---|
   | ungvarsky@gmail.com | TRAINER |
   | klient1@example.com | CLIENT |
   | klient2@example.com | CLIENT |

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Notes

- Tréner pridáva klientov cez stránku **Klienti** — pri vytvorení klienta sa
  mu nastaví prvotné heslo, ktoré mu tréner odovzdá pre prihlásenie.
- Appka je navrhnutá pre jedného trénera; nie je tu verejná registrácia.
