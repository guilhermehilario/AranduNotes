import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import attachmentService from "../services/attachmentService";
import { useToastStore } from "../../../store/toastStore";
import { extractApiError } from "../../../utils/api-errors";

export function useAttachments(leafId: string) {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const attachmentsQuery = useQuery({
    queryKey: ["leaves", leafId, "attachments"],
    queryFn: () => attachmentService.list(leafId),
    enabled: !!leafId,
    staleTime: 10_000,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      attachmentService.upload(leafId, file, (pct) => {
        setUploadProgress((prev) => ({ ...prev, [file.name]: pct }));
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves", leafId, "attachments"] });
      setUploadProgress({});
      useToastStore.getState().addToast("Arquivo enviado com sucesso.", "success");
    },
    onError: (err) => {
      setUploadProgress({});
      useToastStore.getState().addToast(
        extractApiError(err, "Erro ao enviar arquivo."),
        "error",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) => attachmentService.remove(attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves", leafId, "attachments"] });
      useToastStore.getState().addToast("Arquivo removido.", "success");
    },
    onError: (err) => {
      useToastStore.getState().addToast(
        extractApiError(err, "Erro ao remover arquivo."),
        "error",
      );
    },
  });

  const uploadFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => uploadMutation.mutate(file));
    },
    [uploadMutation],
  );

  return {
    attachments: attachmentsQuery.data ?? [],
    isLoading: attachmentsQuery.isLoading,
    uploadFiles,
    isUploading: uploadMutation.isPending,
    uploadProgress,
    deleteAttachment: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
