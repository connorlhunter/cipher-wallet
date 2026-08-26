import type { ReactElement } from "react";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

/** Render the browser-only route outlet. */
function RootLayout(): ReactElement {
  return (
    <main className="app-shell">
      <Outlet />
    </main>
  );
}

/** Render the wallet foundation route. */
function HomePage(): ReactElement {
  return (
    <section aria-labelledby="page-title" className="welcome-panel">
      <p className="eyebrow">Cipher Wallet</p>
      <h1 id="page-title">Litecoin Testnet, under your control.</h1>
      <p>
        Cipher Wallet is a self-custodial browser wallet. The foundation has no
        wallet, recovery phrase, chain request, or signing action yet.
      </p>
    </section>
  );
}

/** Render the local fallback for routes outside the foundation. */
function NotFoundPage(): ReactElement {
  return (
    <section aria-labelledby="page-title" className="welcome-panel">
      <p className="eyebrow">Cipher Wallet</p>
      <h1 id="page-title">Page not found</h1>
      <p>This route is not part of the current client foundation.</p>
    </section>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

const indexRoute = createRoute({
  component: HomePage,
  getParentRoute: () => rootRoute,
  path: "/",
});

const routeTree = rootRoute.addChildren([indexRoute]);

/**
 * Browser-only route tree for the wallet foundation.
 */
export const router = createRouter({
  defaultPreload: "intent",
  routeTree,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
