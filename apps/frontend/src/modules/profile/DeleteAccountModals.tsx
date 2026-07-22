import React from "react";
import { AlertTriangle, Mail } from "lucide-react";
import { Modal } from "../../components/ui/Modal.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { useDeleteAccount } from "./hooks/useDeleteAccount";

interface DeleteAccountModalsProps {
  userEmail?: string;
  onComplete?: () => void;
}

export const DeleteAccountModals: React.FC<DeleteAccountModalsProps> = ({
  userEmail,
  onComplete,
}) => {
  const {
    deleteStep,
    typedCode,
    setTypedCode,
    emailCode,
    setEmailCode,
    confirmationCode,
    sendingEmail,
    deleting,
    confirmStep1,
    sendEmailConfirmation,
    confirmDeleteWithCode,
    resetDeleteFlow,
  } = useDeleteAccount({ onComplete });

  return (
    <>
      {/* Step 1: Type on-screen code */}
      <Modal
        isOpen={deleteStep === 1}
        onClose={resetDeleteFlow}
        title="Confirmar Exclusão de Conta"
        size="sm"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Esta ação irá remover permanentemente sua conta e todos os seus
              dados. Esta ação não pode ser desfeita.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-dark-200">
              Digite o código abaixo para confirmar a exclusão:
            </label>
            <div className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-center">
              <span className="text-lg font-extrabold tracking-[0.25em] text-rose-600 dark:text-rose-400 select-all font-mono">
                {confirmationCode}
              </span>
            </div>
          </div>

          <Input
            value={typedCode}
            onChange={(e) => setTypedCode(e.target.value)}
            placeholder="Digite o código acima..."
            className="text-center font-mono tracking-wider uppercase"
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={resetDeleteFlow}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={confirmStep1}
              disabled={typedCode !== confirmationCode}
              className="flex-1"
            >
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>

      {/* Step 2: Final warning + send email */}
      <Modal
        isOpen={deleteStep === 2}
        onClose={resetDeleteFlow}
        title="Última Confirmação"
        size="sm"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30">
            <AlertTriangle className="h-6 w-6 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-700 dark:text-rose-300 mb-1">
                Tem certeza que deseja fazer a exclusão dessa conta?
              </p>
              <p className="text-sm text-rose-600 dark:text-rose-400/80">
                Essa ação será definitiva e não terá como recuperar essa conta.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-dark-800/50 rounded-xl p-4 border border-slate-100 dark:border-dark-700">
            <p className="text-xs text-slate-500 dark:text-dark-400 leading-relaxed">
              Um e-mail de confirmação será enviado para{" "}
              <strong className="text-slate-700 dark:text-dark-200">
                {userEmail}
              </strong>
              . Você precisará digitar o código recebido para concluir a
              exclusão.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={resetDeleteFlow}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={sendEmailConfirmation}
              isLoading={sendingEmail}
              className="flex-1"
            >
              {sendingEmail ? "Enviando..." : "Enviar E-mail de Confirmação"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Step 3: Type email code */}
      <Modal
        isOpen={deleteStep === 3}
        onClose={resetDeleteFlow}
        title="Código de Confirmação"
        size="sm"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <Mail className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                E-mail enviado!
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400/80 mt-0.5">
                Enviamos um código de 6 dígitos para{" "}
                <strong>{userEmail}</strong>. O código expira em 15 minutos.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-dark-200">
              Código de confirmação
            </label>
            <Input
              value={emailCode}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                setEmailCode(digits);
              }}
              placeholder="000000"
              className="text-center font-mono text-2xl tracking-[0.3em]"
              maxLength={6}
            />
            <p className="text-xs text-slate-400 dark:text-dark-500 text-center">
              Digite o código de 6 dígitos recebido no e-mail
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={resetDeleteFlow}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteWithCode}
              isLoading={deleting}
              disabled={emailCode.length !== 6}
              className="flex-1"
            >
              {deleting ? "Excluindo..." : "Confirmar e Excluir Conta"}
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={sendEmailConfirmation}
              disabled={sendingEmail}
              className="text-xs text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 underline cursor-pointer disabled:opacity-50"
            >
              {sendingEmail ? "Reenviando..." : "Reenviar e-mail"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DeleteAccountModals;
