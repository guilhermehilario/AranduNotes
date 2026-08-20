import {
  useState,
  useEffect,
  useRef,
  useCallback,
  startTransition,
} from "react";
import { useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import DOMPurify from "dompurify";
import { useEditorExtensions } from "./editorExtensions";
import { useEditorSave } from "./useEditorSave";
import type { Leaf } from "../types";

/** 🔐 ALTO-11: Schema de URLs permitidas no Ctrl+Click (apenas http/https) */
const ALLOWED_URL_SCHEMES = new Set(["http:", "https:"]);

/** 🔐 ALTO-11: Sanitiza HTML recebido do servidor antes de carregar no editor */
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "em", "u", "s", "code", "pre", "blockquote",
      "ul", "ol", "li", "a", "img", "hr",
      "table", "thead", "tbody", "tr", "th", "td",
      "input",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class", "style",
      "target", "rel", "type", "checked", "data-type",
      "data-color", "text-align",
    ],
    ALLOW_DATA_ATTR: false,
  });
}

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

/**
 * Hook central do editor de folhas de anotação.
 *
 * Responsabilidades:
 * - Gerenciar estado local do título/conteúdo/texto bruto
 * - Criar e configurar a instância do editor Tiptap
 * - Sincronizar conteúdo inicial do servidor
 * - Orquestrar o salvamento (delegado ao useEditorSave)
 */
export function useEditorContent({
  leaf,
  leafId,
  updateLeaf,
  editorStatus,
}: UseEditorContentParams): UseEditorContentReturn {
  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [localRawText, setLocalRawText] = useState("");
  const [contentReady, setContentReady] = useState(false);

  const initialSyncDoneRef = useRef(false);
  const serverContentRef = useRef("");
  const lastSavedRef = useRef({ title: "", content: "" });
  const saveInFlightRef = useRef(false);

  // Refs para acesso aos valores mais recentes em event listeners (beforeunload, etc.)
  const latestValuesRef = useRef({ title: "", content: "", rawText: "" });

  const extensions = useEditorExtensions();

  const handleEditorUpdate = useCallback(
    ({ editor: ed }: { editor: Editor }) => {
      const currentHtml = ed.getHTML();
      if (currentHtml === serverContentRef.current) return;

      setLocalContent(currentHtml);
      setLocalRawText(ed.getText());
    },
    [],
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
      handleClick: (view, pos, event) => {
        // Ctrl+Click ou Cmd+Click abre o link em nova aba
        if (!(event.ctrlKey || event.metaKey)) return false;

        const { state } = view;
        const $pos = state.doc.resolve(pos);
        const linkMark = $pos.marks().find((m) => m.type.name === "link");

        if (linkMark?.attrs.href) {
          // 🔐 ALTO-11: Validar scheme da URL (apenas http/https — bloqueia javascript:, data:, etc.)
          try {
            const url = new URL(linkMark.attrs.href);
            if (ALLOWED_URL_SCHEMES.has(url.protocol)) {
              window.open(linkMark.attrs.href, "_blank", "noopener,noreferrer");
            }
          } catch {
            // URL inválida — ignora o clique
          }
          return true; // Consumiu o clique, impede ação padrão do editor
        }

        return false;
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

    const serverContent = sanitizeHtml(leaf.content || "");
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
    latestValuesRef.current = {
      title: localTitle,
      content: localContent,
      rawText: localRawText,
    };
  }, [localTitle, localContent, localRawText]);

  // ── Salvamento (delegado ao hook especializado) ──
  const { flushSave } = useEditorSave({
    leafId,
    updateLeaf,
    localTitle,
    localContent,
    localRawText,
    initialSyncDoneRef,
    lastSavedRef,
    saveInFlightRef,
    latestValuesRef,
  });

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
