import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginView from "./modules/auth/views/LoginView";
import VerifyEmailView from "./modules/auth/views/VerifyEmailView";

const queryClient = new QueryClient();
const App = () => {
  return (
    <Routes>
      <Route path={"/verify-email"} element={<VerifyEmailView />} />
      <Route path={"/login"} element={<LoginView />} />
      <Route path={"*"} element={<Navigate to={"/login"} replace />} />
    </Routes>
  );
};
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
