import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { TextArea } from '../../../components/ui/TextArea.tsx';
import type { Question, CreateQuestionInput } from '../types';

type QuestionTypeOption = 'multiple_choice' | 'dissertative';

interface NotebookOption {
  id: string;
  title: string;
  color: string;
}

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebooks: NotebookOption[];
  editing?: Question | null;
  defaultNotebookId?: string;
  onSubmit: (data: CreateQuestionInput) => Promise<void>;
  isPending: boolean;
}

const TYPE_LABELS: Record<QuestionTypeOption, string> = {
  multiple_choice: 'Múltipla Escolha',
  dissertative: 'Dissertativa',
};

function initialOptions(editing: Question | null): string[] {
  if (!editing) return ['', '', '', ''];
  if (editing.questionType === 'dissertative') return [''];
  let parsed: string[];
  try {
    parsed = JSON.parse(editing.options);
  } catch {
    parsed = [];
  }
  const cleaned = parsed.filter((o) => typeof o === 'string');
  return cleaned.length > 1 ? [...cleaned, ''] : ['', '', '', ''];
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  onClose,
  notebooks,
  editing = null,
  defaultNotebookId,
  onSubmit,
  isPending,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Editar Questão' : 'Nova Questão'}
      size="lg"
      footer={null}
    >
      <QuestionForm
        key={`${isOpen}-${editing?.id ?? 'new'}-${defaultNotebookId ?? 'none'}`}
        editing={editing}
        notebooks={notebooks}
        defaultNotebookId={defaultNotebookId}
        onSubmit={onSubmit}
        isPending={isPending}
        onClose={onClose}
      />
    </Modal>
  );
};

const QuestionForm: React.FC<{
  editing: Question | null;
  notebooks: NotebookOption[];
  defaultNotebookId?: string;
  onSubmit: (data: CreateQuestionInput) => Promise<void>;
  isPending: boolean;
  onClose: () => void;
}> = ({ editing, notebooks, defaultNotebookId, onSubmit, isPending, onClose }) => {
  const isEditing = !!editing;
  const [questionType, setQuestionType] = useState<QuestionTypeOption>(
    editing?.questionType === 'dissertative' ? 'dissertative' : 'multiple_choice',
  );
  const [notebookId, setNotebookId] = useState(
    editing?.notebookId ?? defaultNotebookId ?? (notebooks.length === 1 ? notebooks[0].id : ''),
  );
  const [question, setQuestion] = useState(editing?.question ?? '');
  const [theme, setTheme] = useState(editing?.theme ?? '');
  const [options, setOptions] = useState<string[]>(initialOptions(editing));
  const [correctAnswer, setCorrectAnswer] = useState(editing?.correctAnswer ?? '');
  const [explanation, setExplanation] = useState(editing?.explanation ?? '');
  const [error, setError] = useState('');

  const handleOptionChange = (idx: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? value : o)));
  };

  const addOption = () => setOptions((prev) => [...prev, '']);
  const removeOption = (idx: number) => {
    const removedValue = options[idx];
    setOptions((prev) => prev.filter((_, i) => i !== idx));
    if (options.length > 2 && correctAnswer === removedValue) {
      setCorrectAnswer('');
    }
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      setError('A pergunta é obrigatória.');
      return;
    }
    if (!notebookId) {
      setError('Selecione um caderno.');
      return;
    }

    if (questionType === 'dissertative') {
      if (!correctAnswer.trim()) {
        setError('Informe a resposta de referência (gabarito).');
        return;
      }
    } else {
      const filled = options.map((o) => o.trim()).filter(Boolean);
      if (filled.length < 2) {
        setError('Adicione pelo menos 2 alternativas.');
        return;
      }
      if (!correctAnswer || !filled.includes(correctAnswer)) {
        setError('Marque a alternativa correta.');
        return;
      }
    }

    setError('');
    await onSubmit({
      notebookId,
      question: question.trim(),
      theme: theme.trim() || undefined,
      options:
        questionType === 'dissertative'
          ? '[]'
          : JSON.stringify(options.map((o) => o.trim()).filter(Boolean)),
      correctAnswer: correctAnswer.trim(),
      explanation: explanation.trim() || undefined,
      questionType,
    });
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Tipo */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700 dark:text-dark-200">
            Tipo de questão
          </span>
          <div className="flex items-center gap-2">
            {(['multiple_choice', 'dissertative'] as QuestionTypeOption[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setQuestionType(type);
                  if (type === 'dissertative') {
                    setOptions(['']);
                    if (correctAnswer) setCorrectAnswer('');
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                  questionType === type
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-white dark:bg-dark-900 text-slate-600 dark:text-dark-300 border-slate-200 dark:border-dark-700 hover:border-emerald-300'
                }`}
              >
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Caderno */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-dark-200">
            Caderno
          </label>
          <select
            value={notebookId}
            onChange={(e) => setNotebookId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl text-slate-900 dark:text-dark-50 focus:outline-none focus:ring-4 focus:ring-brand-100 dark:focus:ring-brand-900/20 focus:border-brand-500 transition-all duration-200 cursor-pointer"
          >
            <option value="">Selecione um caderno...</option>
            {notebooks.map((nb) => (
              <option key={nb.id} value={nb.id}>
                {nb.title}
              </option>
            ))}
          </select>
          {notebooks.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-dark-500">
              Crie um caderno antes de adicionar questões.
            </p>
          )}
        </div>

        {/* Tema */}
        <Input
          label="Tema"
          placeholder="Ex: Citologia, Geometria, Direito Penal..."
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          maxLength={80}
        />

        <Input
          label="Enunciado da questão"
          placeholder="Ex: Qual a função da mitocôndria na célula?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        {/* Opções / Gabarito */}
        {questionType === 'multiple_choice' ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-dark-200">
              Alternativas
            </span>
            {options.map((option, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectAnswer(option)}
                  aria-label={`Marcar alternativa ${String.fromCharCode(65 + idx)} como correta`}
                  className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                    correctAnswer === option
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-slate-300 dark:border-dark-600'
                  }`}
                >
                  {correctAnswer === option && (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  )}
                </button>
                <span className="w-5 text-sm font-bold text-slate-400 dark:text-dark-500">
                  {String.fromCharCode(65 + idx)}
                </span>
                <Input
                  placeholder={`Alternativa ${String.fromCharCode(65 + idx)}`}
                  value={option}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="py-2"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    aria-label="Remover alternativa"
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="w-11" />
              <Button
                variant="secondary"
                size="sm"
                onClick={addOption}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                Adicionar alternativa
              </Button>
            </div>
          </div>
        ) : (
          <TextArea
            label="Resposta de referência (gabarito)"
            placeholder="Ex: A mitocôndria é responsável pela produção de energia (ATP) através da respiração celular..."
            rows={4}
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
          />
        )}

        <TextArea
          label="Explicação (opcional)"
          placeholder="Comentário que será exibido após responder..."
          rows={3}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />

        {error && (
          <p className="text-sm text-rose-500 font-medium">{error}</p>
        )}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} isLoading={isPending}>
          {isEditing ? 'Salvar' : 'Criar Questão'}
        </Button>
      </div>
    </>
  );
};

export default QuestionFormModal;