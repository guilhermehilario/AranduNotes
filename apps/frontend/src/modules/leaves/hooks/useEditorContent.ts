import { useState, useEffect, useRef, useMemo, useCallback, startTransition } from "react";
import { useToastStore } from "../../../store/toastStore";
import { extractApiError } from "../../../utils/api-errors";
import type { Editor } from "@tiptap/react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Annotation } from "../extensions/Annotation";
import { Indent } from "../extensions/Indent";
import { useDebounce } from "../../../hooks/useDebounce";
import { useAuthStore } from "../../../modules/auth/store";
import { useEditorStatusStore } from "../../../store/editorStatusStore";
import type { Leaf } from "../types";

const DEBOUNCE_MS = 800;
const SAVE_STATUS_IDLE_MS = 2000;

interface UseEditorContentParams {
  leaf: Leaf | undefined;
  leafId: string;
  updateLeaf: (data: {
    title: string;
    content: string;
    rawText: string;
  }) => Promise<unknown>;
  editorStatus: {
    show: () => void;
    hide: () => void;
    setSaveStatus: (status: "idle" | "saving" | "saved" | "error") => void;
    setLastUpdate: (timestamp: string) => void;
  };
}

interface UseEditorContentReturn {
  editor: Editor | null;
  localTitle: string;
  setLocalTitle: React.Dispatch<React.SetStateAction<string>>;
  localContent: string;
  localRawText: string;
  contentReady: boolean;
  flushSave: () => Promise<void>;
}

export function useEditorContent({
  leaf,
  leafId,
  updateLeaf,
  editorStatus,
}: UseEditorContentParams): UseEditorContentReturn {
  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [localRawText, setLocalRawText] = useState("");

  const initialSyncDoneRef = useRef(false);
  const serverContentRef = useRef("");
  const lastSavedRef = useRef({ title: "", content: "" });
  const saveInFlightRef = useRef(false);
  const [contentReady, setContentReady] = useState(false);

  // Refs para acesso aos valores mais recentes em event listeners (beforeunload, etc.)
  const latestValuesRef = useRef({ title: "", content: "", rawText: "" });
  const leafIdRef = useRef(leafId);
  leafIdRef.current = leafId;
  // 🔴 Inicializa com null — flushSave/sendKeepaliveSave são definidos depois via useCallback
  //    Evita ReferenceError (temporal dead zone). O useEffect de sync atualiza as refs após mount.
  const flushSaveRef = useRef<(() => Promise<void>) | null>(null);
  const sendKeepaliveSaveRef = useRef<(() => void) | null>(null);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),
      Indent.configure({
        types: ["paragraph", "heading", "blockquote"],
        maxLevel: 4,
        indentStep: 1.5,
      }),
      Annotation,
      Placeholder.configure({
        placeholder: "Comece a digitar o conteúdo da sua aula aqui...",
      }),
    ],
    [],
  );

  const handleEditorUpdate = useCallback(
    ({ editor: ed }: { editor: Editor }) => {
      const currentHtml = ed.getHTML();
      if (currentHtml === serverContentRef.current) return;

      setLocalContent(currentHtml);
      setLocalRawText(ed.getText());
      useEditorStatusStore.getState().setSaveStatus("saving");
    },
    [], // 🔴 Não depende de editorStatus — acessa store diretamente
  );

  const editor = useEditor({
    extensions,
    content: "",
    onUpdate: handleEditorUpdate,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        style:
          "overflow-wrap: break-word; word-break: break-word; overflow-wrap: anywhere; white-space: pre-wrap; width: 100%; max-width: 100%; box-sizing: border-box;",
      },
    },
  });

  // Força os estilos de quebra de texto diretamente via JS no DOM do ProseMirror
  useEffect(() => {
    if (!editor) return;
    const editorDom = editor.view?.dom as HTMLElement | undefined;
    if (!editorDom) return;

    Object.assign(editorDom.style, {
      overflowWrap: "break-word",
      wordBreak: "break-word",
      whiteSpace: "pre-wrap",
      width: "100%",
      maxWidth: "100%",
      boxSizing: "border-box",
    });
  }, [editor]);

  // Sync inicial: carrega o conteúdo do servidor para o editor
  useEffect(() => {
    if (!leaf || !editor || initialSyncDoneRef.current) return;

    const serverContent = leaf.content || "";
    serverContentRef.current = serverContent;
    lastSavedRef.current = { title: leaf.title, content: serverContent };

    editor.commands.setContent(serverContent);

    startTransition(() => {
      setLocalTitle(leaf.title);
      setLocalContent(serverContent);
      setLocalRawText(leaf.rawText || "");
      setContentReady(true);
    });

    initialSyncDoneRef.current = true;
    editorStatus.show();
    editorStatus.setLastUpdate(
      typeof leaf.updatedAt === "string"
        ? leaf.updatedAt
        : leaf.updatedAt.toISOString(),
    );
  }, [leaf, editor, editorStatus]);

  // Mantém latestValuesRef atualizado
  useEffect(() => {
    latestValuesRef.current = { title: localTitle, content: localContent, rawText: localRawText };
  }, [localTitle, localContent, localRawText]);

  // Mantém refs das funções atualizadas para uso em effects com deps vazias
  useEffect(() => {
    flushSaveRef.current = flushSave;
    sendKeepaliveSaveRef.current = sendKeepaliveSave;
  });

  /** Salva imediatamente sem esperar debounce */
  const flushSave = useCallback(async () => {
    const { title, content, rawText } = latestValuesRef.current;
    if (!initialSyncDoneRef.current) return;

    // Se o título está vazio, usa o último título salvo para não sobrescrever no servidor
    const titleToSave = title && title.length > 0 ? title : lastSavedRef.current.title;

    const lastSaved = lastSavedRef.current;
    if (titleToSave === lastSaved.title && content === lastSaved.content) return;
    if (saveInFlightRef.current) return;

    saveInFlightRef.current = true;
    useEditorStatusStore.getState().setSaveStatus("saving");

    try {
      await updateLeaf({ title: titleToSave, content, rawText });
      lastSavedRef.current = { title: titleToSave, content };
      useEditorStatusStore.getState().setLastUpdate(new Date().toISOString());
      useEditorStatusStore.getState().setSaveStatus("saved");
    } catch (err) {
      useEditorStatusStore.getState().setSaveStatus("error");
      const errorMessage = extractApiError(err, "Erro ao salvar. Tente novamente.");
      useToastStore.getState().addToast(errorMessage, "error");
    } finally {
      saveInFlightRef.current = false;
    }
  }, [updateLeaf]); // 🔴 Não depende de editorStatus — acessa o store diretamente para evitar loop

  /**
   * Envia um salvamento de emergência via fetch com keepalive.
   * Usado como garantia quando o navegador está prestes a suspender a aba
   * (visibilitychange) ou fechar a página (beforeunload).
   * O keepalive diz ao navegador para não abortar a requisição mesmo que
   * a página seja descarregada antes da resposta chegar.
   */
  const sendKeepaliveSave = useCallback(() => {
    const { title, content, rawText } = latestValuesRef.current;
    if (!initialSyncDoneRef.current) return;

    const titleToSave = title && title.length > 0 ? title : lastSavedRef.current.title;
    const lastSaved = lastSavedRef.current;
    if (titleToSave === lastSaved.title && content === lastSaved.content) return;

    const currentLeafId = leafIdRef.current;
    if (!currentLeafId) return;

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const accessToken = useAuthStore.getState().accessToken;

    fetch(`${baseUrl}/leaves/${currentLeafId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        title: titleToSave,
        content,
        rawText,
      }),
      keepalive: true,
      credentials: "include",
    }).catch(() => {
      // Silencia erros — é um salvamento best-effort de emergência
    });
  }, []);

  // ── Salvar ao perder foco (mudar de aba), fechar aba, ou desmontar ──
  // NOTA: Não colocar flushSave/sendKeepaliveSave nas deps pq elas mudam
  // de referência e fazem o cleanup (que chama flushSave) disparar em loop.
  // Em vez disso, acessamos os valores via refs dentro dos handlers.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushSaveRef.current?.();
        sendKeepaliveSaveRef.current?.();
      }
    };

    const handleBeforeUnload = () => {
      sendKeepaliveSaveRef.current?.();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Salva imediatamente ao desmontar o componente (navegação interna)
      flushSaveRef.current?.();
    };
  }, []); // 🔴 Dependências vazias — usa refs para evitar loop de cleanup

  const debouncedTitle = useDebounce(localTitle, DEBOUNCE_MS);
  const debouncedContent = useDebounce(localContent, DEBOUNCE_MS);
  const debouncedRawText = useDebounce(localRawText, DEBOUNCE_MS);

  // Auto-save com debounce: salva quando o usuário para de digitar
  useEffect(() => {
    if (!initialSyncDoneRef.current) return;

    const lastSaved = lastSavedRef.current;

    // Se o título está vazio, usa o último título salvo para não sobrescrever no servidor
    const titleToSave =
      debouncedTitle && debouncedTitle.length > 0
        ? debouncedTitle
        : lastSaved.title;

    if (
      titleToSave !== lastSaved.title ||
      debouncedContent !== lastSaved.content
    ) {
      if (saveInFlightRef.current) return;

      saveInFlightRef.current = true;
      useEditorStatusStore.getState().setSaveStatus("saving");

      void updateLeaf({
        title: titleToSave,
        content: debouncedContent,
        rawText: debouncedRawText,
      })
        .then(() => {
          lastSavedRef.current = {
            title: titleToSave,
            content: debouncedContent,
          };
          useEditorStatusStore.getState().setLastUpdate(new Date().toISOString());
          useEditorStatusStore.getState().setSaveStatus("saved");

          // Volta ao status "idle" após 2s
          setTimeout(() => {
            useEditorStatusStore.getState().setSaveStatus("idle");
          }, SAVE_STATUS_IDLE_MS);
        })
        .catch((err) => {
          useEditorStatusStore.getState().setSaveStatus("error");
          const errorMessage = extractApiError(err, "Erro ao salvar. Tente novamente.");
          useToastStore.getState().addToast(errorMessage, "error");
        })
        .finally(() => {
          saveInFlightRef.current = false;
        });
    }
  }, [debouncedTitle, debouncedContent, debouncedRawText, updateLeaf]);
  // 🔴 editorStatus removido das deps — acessa store diretamente via getState() para evitar loop

  return {
    editor,
    localTitle,
    setLocalTitle,
    localContent,
    localRawText,
    contentReady,
    flushSave,
  };
}
