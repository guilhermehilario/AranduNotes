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
  /** Quando false, o editor fica em modo somente leitura (sem salvar). */
  editable?: boolean;
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
  editable = true,
}: UseEditorContentParams): UseEditorContentReturn {
  const [localTitle, setLocalTitle] = useState("");
  const [localContent, setLocalContent] = useState("");
  const [localRawText, setLocalRawText] = useState("");
  const [contentReady, setContentReady] = useState(false);

  const initialSyncDoneRef = useRef(false);
  const serverContentRef = useRef("");
  const lastSavedRef = useRef({ title: "", content: "" });
  const saveInFlightRef = useRef(false);
  // true quando houver edição real do usuário (digitação/delete no editor).
  // Garante que um save com conteúdo vazio só sobrescreva o que já existia
  // se o usuário realmente limpou o conteúdo.
  const userEditedRef = useRef(false);
  // Sinaliza que o sync inicial foi disparado mas o conteúdo local ainda não
  // foi confirmado pelo React (startTransition). O save só é liberado depois.
  const pendingInitialSyncRef = useRef(false);
  const previousLeafIdRef = useRef(leafId);

  // Refs para acesso aos valores mais recentes em event listeners (beforeunload, etc.)
  const latestValuesRef = useRef({ title: "", content: "", rawText: "" });

  const extensions = useEditorExtensions();

  const handleEditorUpdate = useCallback(
    ({ editor: ed }: { editor: Editor }) => {
      const currentHtml = ed.getHTML();
      if (currentHtml === serverContentRef.current) return;
      userEditedRef.current = true;

      setLocalContent(currentHtml);
      setLocalRawText(ed.getText());
    },
    [],
  );

  const editor = useEditor({
    extensions,
    content: "",
    editable,
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

  // Força o modo somente leitura de forma reativa (muda junto com as
  // permissões carregadas do caderno).
  useEffect(() => {
    if (!editor) return;
    if (editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

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

  // Quando o usuário navega para outra folha (o EditorView permanece montado),
  // reseta o estado de sync para que o conteúdo/campos da nova folha sejam
  // carregados. Sem isso o editor continuaria mostrando a folha anterior.
  useEffect(() => {
    if (previousLeafIdRef.current === leafId) return;
    previousLeafIdRef.current = leafId;

    pendingInitialSyncRef.current = false;
    initialSyncDoneRef.current = false;
    userEditedRef.current = false;
    serverContentRef.current = "";
    lastSavedRef.current = { title: "", content: "" };

    setContentReady(false);
    setLocalTitle("");
    setLocalContent("");
    setLocalRawText("");
  }, [leafId]);

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
      // O sync só é marcado como concluído depois que o React confirmar o
      // conteúdo local (ver efeito de latestValuesRef). Assim nenhum save é
      // disparado com conteúdo vazio durante a janela de carregamento.
      pendingInitialSyncRef.current = true;
    });

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

    // Só libera o salvamento quando o conteúdo local (localContent) já reflete
    // o que veio do servidor — fecha a janela onde latestValuesRef ainda
    // poderia estar vazio e um save vazio sobrescreveria o conteúdo.
    if (
      pendingInitialSyncRef.current &&
      localContent === serverContentRef.current
    ) {
      pendingInitialSyncRef.current = false;
      initialSyncDoneRef.current = true;
    }
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
    userEditedRef,
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
