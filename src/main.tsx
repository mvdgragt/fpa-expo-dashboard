import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { env, envIsConfigured } from "./lib/env";
(window as unknown as { __FPA_ENV__?: unknown }).__FPA_ENV__ = {
  envIsConfigured,
  supabaseUrl: env.supabaseUrl,
  supabaseAnonKeyPrefix: env.supabaseAnonKey
    ? env.supabaseAnonKey.slice(0, 12)
    : "",
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
