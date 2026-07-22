/**
 * 🏗️ buildTree — Constrói uma árvore hierárquica a partir de uma lista plana
 *
 * Útil para transformar dados com parentId (como folhas de anotação)
 * em uma estrutura aninhada de pais e filhos.
 *
 * @example
 * const items = [
 *   { id: '1', parentId: null },
 *   { id: '2', parentId: '1' },
 *   { id: '3', parentId: '1' },
 * ];
 * const tree = buildTree(items);
 * // [
 * //   { id: '1', parentId: null, children: [
 * //     { id: '2', parentId: '1', children: [] },
 * //     { id: '3', parentId: '1', children: [] },
 * //   ]}
 * // ]
 */

export type TreeNode<T> = T & {
  children: TreeNode<T>[];
};

export function buildTree<T extends { id: string; parentId: string | null }>(
  items: T[],
): TreeNode<T>[] {
  const map = new Map<string, TreeNode<T>>();
  const roots: TreeNode<T>[] = [];

  // Primeiro, cria todos os nós com children vazio
  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  // Depois, monta a hierarquia
  items.forEach((item) => {
    const node = map.get(item.id);
    if (!node) return;

    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else if (!item.parentId) {
      roots.push(node);
    }
  });

  return roots;
}
