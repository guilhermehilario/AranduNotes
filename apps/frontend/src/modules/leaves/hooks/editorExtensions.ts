import { useMemo } from "react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Annotation } from "../extensions/Annotation";
import { Indent } from "../extensions/Indent";
import type { Extensions } from "@tiptap/react";

/**
 * Hook que retorna a configuração memoizada das extensões do Tiptap
 * utilizadas no editor de folhas de anotação.
 */
export function useEditorExtensions(): Extensions {
  return useMemo(
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
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Annotation,
      Placeholder.configure({
        placeholder: "Comece a digitar o conteúdo da sua aula aqui...",
      }),
    ],
    [],
  );
}
