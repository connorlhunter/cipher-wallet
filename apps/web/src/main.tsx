import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { router } from "./router";
import "./styles.css";

const appElement = document.getElementById("app");

if (appElement === null) {
  throw new Error("Cipher Wallet could not find the application root.");
}

createRoot(appElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
