# Copilot Instructions for This Codebase

## Project Overview
- This is a Next.js (React) monorepo, bootstrapped with `create-next-app` and using TypeScript, Tailwind CSS, and shadcn/ui components.
- The main app code is under the `app/` directory. Key UI components are in `app/components/` and `@/components` (aliased in `components.json`).
- The project uses modern React patterns (function components, hooks, server/client components) and leverages Next.js routing and layouts.
- Tailwind CSS is configured in `tailwind.config.ts` and used throughout for styling. Custom CSS is in `styles.css`.
- Monetization and analytics integrations are present (see `@/components/monetization/*`, `@/lib/todo-analytics`).

## Key Workflows
- **Development:** Use `npm run dev` (or `yarn dev`, `pnpm dev`, `bun dev`) to start the local server.
- **Build:** Use `npm run build` to create a production build.
- **Lint:** Use `npm run lint` to check code style.
- **Deployment:** Designed for Vercel, but can run anywhere Next.js is supported.

## Conventions & Patterns
- **Component Aliases:** Use `@/components`, `@/lib`, `@/hooks` as defined in `components.json` and `tsconfig.json`.
- **Styling:** Prefer Tailwind utility classes. Use custom CSS only for global or special effects.
- **Dark Mode:** Enabled via Tailwind's `darkMode: ["class"]` config.
- **Monetization:** AdSense and affiliate banners are integrated as React components.
- **Premium Features:** Upsell modals and feature gating are handled in `app/todos/components/PremiumUpsell.tsx` and related files.
- **Analytics:** Use `trackEvent` from `@/lib/todo-analytics` for event tracking.

## Integration Points
- **Solana Wallet:** Uses `@solana/wallet-adapter-*` packages for blockchain wallet integration.
- **UI Library:** Uses shadcn/ui (see `components.json` for config).
- **Icons:** Uses `lucide-react` for iconography.

## Examples
- To add a new page: create a file in `app/[route]/page.tsx`.
- To add a new UI component: add to `@/components` and import via alias.
- To add a new Tailwind style: update `tailwind.config.ts` and use the class in your component.

## References
- See `README.md` for Next.js basics and dev workflow.
- See `tailwind.config.ts` for styling conventions.
- See `components.json` for alias and UI config.
- See `app/page.tsx` for landing page structure and ad integration.

---

If you are unsure about a pattern or integration, check for similar usage in the `app/` and `@/components` directories, or ask for clarification.
