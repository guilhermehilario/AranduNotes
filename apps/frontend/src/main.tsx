import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.tsx";

// ── Tema: pré-hidratação ──
// Aplica a classe dark no <html> ANTES do React montar, evitando o "flash"
// de tema errado no primeiro paint (lê a preferência persistida no localStorage
// e resolve o modo 'system' via matchMedia).
(function preHydrateTheme() {
  try {
    const raw = localStorage.getItem("studynotes-ui");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const pref = parsed?.state?.theme ?? "system";
    const prefersDark =
      pref === "dark" ||
      (pref === "system" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", prefersDark);
  } catch {
    // Preferência inválida — segue sem aplicar tema (padrão claro)
  }
})();

// ── SPA Redirect from 404.html fallback ──
// Se o usuário foi redirecionado via 404.html, restauramos a rota original
(function restoreSPARoute() {
  const redirect = sessionStorage.getItem("redirect");
  if (
    redirect &&
    redirect.startsWith('/') && !redirect.startsWith('//') &&
    redirect !== window.location.pathname + window.location.search
  ) {
    sessionStorage.removeItem("redirect");
    window.history.replaceState(null, "", redirect);
  } else {
    sessionStorage.removeItem("redirect");
  }
})();
window.addEventListener("popstate", () => {
  if (import.meta.env.DEV) {
    console.log("URL: ", window.location.href);
  }
});
createRoot(document.getElementById("root")!).render(<App />);
