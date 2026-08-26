import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** Build the Cipher Wallet browser client. */
export default defineConfig({
  plugins: [react()],
});
