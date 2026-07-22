import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import authService from "../../auth/services/authService";
import { useToastStore } from "../../../store/toastStore";

function generateCode(): string {
  return (
    "EXCLUIR-" +
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    Math.random().toString(36).substring(2, 4).toUpperCase()
  );
}

interface UseDeleteAccountOptions {
  onComplete?: () => void;
}

interface UseDeleteAccountReturn {
  deleteStep: 0 | 1 | 2 | 3;
  typedCode: string;
  setTypedCode: React.Dispatch<React.SetStateAction<string>>;
  emailCode: string;
  setEmailCode: React.Dispatch<React.SetStateAction<string>>;
  confirmationCode: string;
  sendingEmail: boolean;
  deleting: boolean;
  startDeleteFlow: () => void;
  confirmStep1: () => void;
  sendEmailConfirmation: () => Promise<void>;
  confirmDeleteWithCode: () => Promise<void>;
  resetDeleteFlow: () => void;
}

export function useDeleteAccount(options?: UseDeleteAccountOptions): UseDeleteAccountReturn {
  const { logout } = useAuth();
  const { onComplete } = options || {};
  const [deleting, setDeleting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2 | 3>(0);
  const [typedCode, setTypedCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [deleteToken, setDeleteToken] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState(generateCode);

  useEffect(() => {
    if (deleteStep === 1) {
      setConfirmationCode(generateCode());
    }
  }, [deleteStep]);

  const resetDeleteFlow = useCallback(() => {
    setDeleteStep(0);
    setTypedCode("");
    setEmailCode("");
    setDeleteToken(null);
    setDeleting(false);
    setSendingEmail(false);
    onComplete?.();
  }, [onComplete]);

  const startDeleteFlow = useCallback(() => {
    setTypedCode("");
    setDeleteStep(1);
  }, []);

  const confirmStep1 = useCallback(() => {
    setTypedCode("");
    setDeleteStep(2);
  }, []);

  const sendEmailConfirmation = useCallback(async () => {
    setSendingEmail(true);
    try {
      const result = await authService.sendDeleteConfirmation();
      setDeleteToken(result.token);
      setDeleteStep(3);
    } catch {
      useToastStore.getState().addToast(
        "Erro ao enviar e-mail de confirmação. Verifique o SMTP.",
        "error",
      );
    } finally {
      setSendingEmail(false);
    }
  }, []);

  const confirmDeleteWithCode = useCallback(async () => {
    if (!deleteToken) return;
    setDeleting(true);
    try {
      await authService.confirmDeletion(deleteToken, emailCode);
      useToastStore.getState().addToast(
        "Conta excluída permanentemente.",
        "success",
      );
      logout();
      window.location.href = "/login";
    } catch {
      useToastStore.getState().addToast(
        "Código inválido ou expirado. Solicite um novo código.",
        "error",
      );
      setDeleting(false);
      setEmailCode("");
    }
  }, [deleteToken, emailCode, logout]);

  return {
    deleteStep,
    typedCode,
    setTypedCode,
    emailCode,
    setEmailCode,
    confirmationCode,
    sendingEmail,
    deleting,
    startDeleteFlow,
    confirmStep1,
    sendEmailConfirmation,
    confirmDeleteWithCode,
    resetDeleteFlow,
  };
}
