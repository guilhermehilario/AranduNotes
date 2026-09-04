import React from "react";
import type { Editor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";
import { EditorToolbar } from "./EditorToolbar";
import { EditorBubbleMenu } from "./EditorBubbleMenu";

interface EditorContentAreaProps {
  editor: Editor | null;
  localTitle: string;
  setLocalTitle: React.Dispatch<React.SetStateAction<string>>;
  setSaveStatus: (status: "idle" | "saving" | "saved" | "error") => void;
  annotationTrigger: { text: string } | null;
  /** Modo somente leitura: esconde a barra de ferramentas e bloqueia a edição do título */
  readOnly?: boolean;
  /** Classes adicionais no container (ex.: ocultar no mobile quando o painel de IA está aberto) */
  className?: string;
}

export const EditorContentArea: React.FC<EditorContentAreaProps> = ({
  editor,
  localTitle,
  setLocalTitle,
  setSaveStatus,
  annotationTrigger,
  readOnly = false,
  className = '',
}) => {
  return (
    <div
      className={`flex-1 flex flex-col bg-white dark:bg-dark-900 border border-slate-100 dark:border-dark-800 rounded-3xl p-4 sm:p-6 min-w-0 overflow-hidden ${className}`}
    >
      <input
        type="text"
        value={localTitle}
        onChange={(e) => {
          if (readOnly) return;
          setLocalTitle(e.target.value);
          setSaveStatus("saving");
        }}
        readOnly={readOnly}
        placeholder="Título da folha..."
        className="editor-title-input"
      />

      {!readOnly && (
        <EditorToolbar
          editor={editor}
          annotationTrigger={annotationTrigger}
        />
      )}

      <div className="tiptap-editor flex-1 overflow-x-hidden overflow-y-auto text-slate-750 dark:text-dark-100 relative min-h-[250px] sm:min-h-[400px] min-w-0 w-full max-w-full pb-1.5">
        {!readOnly && <EditorBubbleMenu editor={editor} />}
        <EditorContent
          editor={editor}
          className="tiptap-content w-full h-full"
          style={{
            maxWidth: "100%",
            overflowWrap: "break-word",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
};

export default EditorContentArea;
