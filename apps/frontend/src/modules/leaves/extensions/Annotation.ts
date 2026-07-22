import { Mark, mergeAttributes } from '@tiptap/core';

export interface AnnotationOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    annotation: {
      setAnnotation: (annotation: { text: string }) => ReturnType;
      unsetAnnotation: () => ReturnType;
    };
  }
}

export const Annotation = Mark.create<AnnotationOptions>({
  name: 'annotation',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      text: {
        default: '',
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-annotation'),
        renderHTML: (attrs) => {
          if (!attrs.text) return {};
          return { 'data-annotation': attrs.text as string };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-annotation]',
        getAttrs: (el) => {
          const text = (el as HTMLElement).getAttribute('data-annotation');
          if (!text) return false;
          return { text };
        },
      },
      // Compatibilidade reversa: anotações salvas anteriormente usavam <mark>
      {
        tag: 'mark[data-annotation]',
        getAttrs: (el) => {
          const text = (el as HTMLElement).getAttribute('data-annotation');
          if (!text) return false;
          return { text };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { class: 'annotation-anchor' },
      ),
      0,
    ];
  },

  addCommands() {
    return {
      setAnnotation:
        (annotation) =>
        ({ commands }) => {
          return commands.setMark(this.name, annotation);
        },
      unsetAnnotation:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
