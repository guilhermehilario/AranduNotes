import React, { useState, useRef, useCallback } from "react";
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
  ListChecks,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { useTodos, useCreateTodo, useUpdateTodo, useDeleteTodo } from "../hooks/useTodos";
import { PageContainer } from "../../../components/ui/PageContainer.tsx";
import { EmptyState } from "../../../components/ui/EmptyState.tsx";
import { LoadingScreen } from "../../../components/ui/LoadingScreen.tsx";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog.tsx";

const TodoListView: React.FC = () => {
  const { data: todos, isLoading } = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = useCallback(async () => {
    const title = newTitle.trim();
    if (!title) return;
    await createTodo.mutateAsync({ title });
    setNewTitle("");
    inputRef.current?.focus();
  }, [newTitle, createTodo]);

  const handleToggle = useCallback(
    (id: string, completed: boolean) => {
      updateTodo.mutate({ id, input: { completed: !completed } });
    },
    [updateTodo],
  );

  const handleStartEdit = useCallback((id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  }, []);

  const handleSaveEdit = useCallback(
    (id: string) => {
      const title = editTitle.trim();
      if (!title) return;
      updateTodo.mutate({ id, input: { title } });
      setEditingId(null);
      setEditTitle("");
    },
    [editTitle, updateTodo],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditTitle("");
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteTodo.mutate(id);
      setDeleteConfirmId(null);
    },
    [deleteTodo],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleAdd();
      }
    },
    [handleAdd],
  );

  const pendingTodos = todos?.filter((t) => !t.completed) ?? [];
  const completedTodos = todos?.filter((t) => t.completed) ?? [];

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <PageContainer>
      {/* Header */}
      <p className="text-slate-500 dark:text-dark-350">
        Organize suas tarefas e acompanhe o que precisa ser feito
      </p>

      {/* Add Todo Form */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Adicionar nova tarefa..."
            className="w-full px-4 py-3.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl text-sm text-slate-800 dark:text-dark-100 placeholder-slate-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-500 transition-all"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newTitle.trim() || createTodo.isPending}
          className="flex items-center gap-2 px-5 py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 dark:disabled:bg-dark-800 text-white disabled:text-slate-500 rounded-2xl font-semibold text-sm transition-all cursor-pointer disabled:cursor-not-allowed shadow-md shadow-brand-500/10"
        >
          {createTodo.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Adicionar
        </button>
      </div>

      {/* Empty State */}
      {todos && todos.length === 0 && (
        <EmptyState
          icon={<ListChecks className="h-8 w-8" />}
          title="Nenhuma tarefa criada"
          description="Adicione sua primeira tarefa acima para começar a organizar seus estudos."
        />
      )}

      {/* Pending Todos */}
      {pendingTodos.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-slate-400 dark:text-dark-400 uppercase tracking-wide px-1">
            Pendentes ({pendingTodos.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {pendingTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isEditing={editingId === todo.id}
                editTitle={editTitle}
                onToggle={() => handleToggle(todo.id, todo.completed)}
                onStartEdit={() => handleStartEdit(todo.id, todo.title)}
                onSaveEdit={() => handleSaveEdit(todo.id)}
                onCancelEdit={handleCancelEdit}
                onEditTitleChange={setEditTitle}
                onDelete={() => setDeleteConfirmId(todo.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-slate-400 dark:text-dark-400 uppercase tracking-wide px-1">
            Concluídas ({completedTodos.length})
          </p>
          <div className="flex flex-col gap-1.5">
            {completedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isEditing={false}
                editTitle=""
                onToggle={() => handleToggle(todo.id, todo.completed)}
                onStartEdit={() => {}}
                onSaveEdit={() => {}}
                onCancelEdit={() => {}}
                onEditTitleChange={() => {}}
                onDelete={() => setDeleteConfirmId(todo.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Excluir tarefa"
        message="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
      />
    </PageContainer>
  );
};

interface TodoItemProps {
  todo: { id: string; title: string; completed: boolean };
  isEditing: boolean;
  editTitle: string;
  onToggle: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditTitleChange: (value: string) => void;
  onDelete: () => void;
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  isEditing,
  editTitle,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTitleChange,
  onDelete,
}) => {
  const editInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSaveEdit();
    if (e.key === "Escape") onCancelEdit();
  };

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-900 rounded-2xl border transition-all duration-200 ${
        todo.completed
          ? "border-slate-100 dark:border-dark-800/60 opacity-60"
          : "border-slate-100 dark:border-dark-800 hover:shadow-sm hover:border-slate-200 dark:hover:border-dark-700"
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        className="flex-shrink-0 cursor-pointer transition-colors"
        title={todo.completed ? "Marcar como pendente" : "Marcar como concluída"}
      >
        {todo.completed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5 text-slate-300 dark:text-dark-500 hover:text-brand-400 transition-colors" />
        )}
      </button>

      {/* Title / Edit Input */}
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            ref={editInputRef}
            type="text"
            value={editTitle}
            onChange={(e) => onEditTitleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-sm text-slate-800 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
          <button
            type="button"
            onClick={onSaveEdit}
            className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors cursor-pointer"
            title="Salvar"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-colors cursor-pointer"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <span
          className={`flex-1 text-sm font-medium transition-all ${
            todo.completed
              ? "text-slate-400 dark:text-dark-400 line-through"
              : "text-slate-800 dark:text-dark-100"
          }`}
        >
          {todo.title}
        </span>
      )}

      {/* Actions */}
      {!todo.completed && !isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={onStartEdit}
            className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-colors cursor-pointer"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TodoListView;
