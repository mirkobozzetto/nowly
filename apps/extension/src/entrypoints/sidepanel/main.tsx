import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/entrypoints/sidepanel/app";
import "@/entrypoints/sidepanel/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
