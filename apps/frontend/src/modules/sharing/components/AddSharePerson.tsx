import React from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';

interface AddSharePersonProps {
  email: string;
  emailError?: string;
  isCreating: boolean;
  onEmailChange: (value: string) => void;
  onAdd: () => void;
}

export const AddSharePerson: React.FC<AddSharePersonProps> = ({
  email,
  emailError,
  isCreating,
  onEmailChange,
  onAdd,
}) => {
  return (
    <>
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-slate-400" />
        <p className="text-sm font-semibold text-slate-800 dark:text-dark-50">
          Pessoas com acesso
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="E-mail do usuário..."
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAdd();
              }
            }}
            error={emailError}
          />
        </div>
        <Button onClick={onAdd} disabled={isCreating} className="flex-shrink-0">
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Adicionar'
          )}
        </Button>
      </div>
    </>
  );
};

export default AddSharePerson;