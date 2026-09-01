/**
 * Attempts to insert text into the currently focused input/textarea
 * at the cursor position, respecting maxLength. Returns true if successful.
 */
export function insertIntoFocusedElement(text: string): boolean {
  const el = document.activeElement;
  if (!el) return false;

  const isInput =
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement;
  const isContentEditable =
    (el instanceof HTMLElement && el.isContentEditable) ||
    el instanceof HTMLSelectElement;

  if (!isInput && !isContentEditable) return false;

  if (isInput) {
    const input = el as HTMLInputElement | HTMLTextAreaElement;

    const maxLength = input.maxLength;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const currentLen = input.value.length;
    const selectedLen = end - start;
    const remaining = maxLength > -1 ? maxLength - (currentLen - selectedLen) : text.length;
    const trimmedText = remaining < text.length ? text.slice(0, remaining) : text;

    const before = input.value.slice(0, start);
    const after = input.value.slice(end);
    input.value = before + trimmedText + after;

    const newCursor = start + trimmedText.length;
    input.setSelectionRange(newCursor, newCursor);

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    return true;
  }

  if (isContentEditable) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.setStartAfter(range.endContainer!);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }

  return false;
}
