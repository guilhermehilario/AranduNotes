import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateLeafSchema } from "../../leaves/types";
import type { CreateLeafInput } from "../../leaves/types";
import { useNavigate } from "react-router-dom";
import { useToastStore } from "../../../store/toastStore";
import { extractApiError } from "../../../utils/api-errors";

interface UseNotebookLeafCreationParams {
  notebookId: string;
  createLeaf: (data: {
    title: string;
    content?: string;
    rawText?: string;
    parentId?: string;
  }) => Promise<{ id: string }>;
}

interface UseNotebookLeafCreationReturn {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  parentLeafId: string | undefined;
  setParentLeafId: (id: string | undefined) => void;
  register: ReturnType<typeof useForm<CreateLeafInput>>["register"];
  handleSubmit: ReturnType<typeof useForm<CreateLeafInput>>["handleSubmit"];
  reset: () => void;
  errors: ReturnType<typeof useForm<CreateLeafInput>>["formState"]["errors"];
  onSubmit: (data: CreateLeafInput) => Promise<void>;
  handleCloseModal: () => void;
}

export function useNotebookLeafCreation({
  notebookId,
  createLeaf,
}: UseNotebookLeafCreationParams): UseNotebookLeafCreationReturn {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parentLeafId, setParentLeafId] = useState<string | undefined>(
    undefined,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateLeafInput>({
    resolver: zodResolver(CreateLeafSchema),
    defaultValues: {
      title: "",
      content: "",
      rawText: "",
    },
  });

  const onSubmit = useCallback(
    async (data: CreateLeafInput) => {
      if (!notebookId) return;
      try {
        const newLeaf = await createLeaf({
          ...data,
          parentId: parentLeafId,
        });
        setIsModalOpen(false);
        reset();
        setParentLeafId(undefined);
        navigate(`/notebooks/${notebookId}/leaves/${newLeaf.id}`);
    } catch (error) {
      useToastStore
        .getState()
        .addToast(extractApiError(error, "Erro ao criar folha."), "error");
    }
    },
    [notebookId, createLeaf, parentLeafId, navigate, reset],
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    reset();
    setParentLeafId(undefined);
  }, [reset]);

  return {
    isModalOpen,
    setIsModalOpen,
    parentLeafId,
    setParentLeafId,
    register,
    handleSubmit,
    reset,
    errors,
    onSubmit,
    handleCloseModal,
  };
}
