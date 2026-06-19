# PrvníProjekt

Prázdná webová aplikace postavená na moderním stacku:

- **[Next.js](https://nextjs.org/)** (App Router) + **[React](https://react.dev/)** 19
- **[TypeScript](https://www.typescriptlang.org/)** + **[Tailwind CSS](https://tailwindcss.com/)**
- **[Prisma](https://www.prisma.io/)** ORM
- **[Postgres na Neonu](https://neon.tech/)** jako databáze
- **[Vercel](https://vercel.com/)** pro hosting
- **GitHub** pro verzování a CI/CD (deploy z gitu)

## Požadavky

- Node.js 20+ (doporučeno 22)
- Účet na [Neon](https://neon.tech/) (databáze) a [Vercel](https://vercel.com/) (hosting)

## Lokální vývoj

```bash
# 1) Instalace závislostí
npm install

# 2) Nastavení proměnných prostředí
cp .env.example .env
# do .env doplň connection stringy z Neon dashboardu

# 3) Vytvoření schématu v databázi
npm run db:push        # nebo: npm run db:migrate pro verzované migrace

# 4) Spuštění vývojového serveru
npm run dev
```

Aplikace poběží na [http://localhost:3000](http://localhost:3000).
Endpoint [http://localhost:3000/api/health](http://localhost:3000/api/health)
ověří připojení k databázi.

## Proměnné prostředí

| Proměnná       | Popis                                                          |
| -------------- | -------------------------------------------------------------- |
| `DATABASE_URL` | Pooled connection string z Neonu (host obsahuje `-pooler`).    |
| `DIRECT_URL`   | Přímý connection string z Neonu (používá ho Prisma Migrate).   |

## Užitečné skripty

| Skript             | Co dělá                                       |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Spustí vývojový server                        |
| `npm run build`    | `prisma generate` + produkční build           |
| `npm run start`    | Spustí produkční build                        |
| `npm run lint`     | ESLint                                        |
| `npm run db:push`  | Synchronizuje schéma do DB bez migrací        |
| `npm run db:migrate` | Vytvoří a aplikuje migraci                   |
| `npm run db:studio`| Otevře Prisma Studio                          |

## Nasazení na Vercel

1. Pushni repozitář na GitHub.
2. Na [vercel.com](https://vercel.com/new) naimportuj repozitář.
3. V nastavení projektu (Environment Variables) přidej `DATABASE_URL`
   a `DIRECT_URL` z Neonu.
4. Deploy. Build command `prisma generate && next build` je nastaven
   v `package.json` i ve `vercel.json`.

> Tip: Neon má oficiální integraci s Vercelem
> ([Vercel ↔ Neon](https://neon.tech/docs/guides/vercel)), která umí
> nastavit proměnné prostředí automaticky.
