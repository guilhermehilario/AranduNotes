import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      /**
       * Increase the indent level of the selected block nodes.
       */
      indent: () => ReturnType;
      /**
       * Decrease the indent level of the selected block nodes.
       */
      outdent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading", "blockquote"],
      maxLevel: 4,
      indentStep: 1.5, // em
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => {
              const style = el.getAttribute("style") || "";
              const match = style.match(/padding-left:\s*(\d+(?:\.\d+)?)\s*em/);
              return match ? Math.round(Number(match[1]) / this.options.indentStep) : 0;
            },
            renderHTML: (attrs) => {
              if (!attrs.indent || attrs.indent === 0) return {};
              return { style: `padding-left: ${attrs.indent * this.options.indentStep}em` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { $from, $to } = selection;
          let updated = false;

          state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent < this.options.maxLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent + 1,
                });
                updated = true;
              }
            }
          });

          if (updated && dispatch) {
            dispatch(tr);
            return true;
          }
          return false;
        },
      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { $from, $to } = selection;
          let updated = false;

          state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent > 0) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent - 1,
                });
                updated = true;
              }
            }
          });

          if (updated && dispatch) {
            dispatch(tr);
            return true;
          }
          return false;
        },
    };
  },
});
