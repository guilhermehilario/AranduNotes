import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./App.tsx";

// ── SPA Redirect from 404.html fallback ──
// Se o usuário foi redirecionado via 404.html, restauramos a rota original
(function restoreSPARoute() {
  const redirect = sessionStorage.getItem("redirect");
  if (redirect && redirect !== window.location.pathname + window.location.search) {
    sessionStorage.removeItem("redirect");
    window.history.replaceState(null, "", redirect);
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
