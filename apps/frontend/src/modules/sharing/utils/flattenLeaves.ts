import type { Leaf } from '../../leaves/types';

export interface FlatLeaf {
  id: string;
  title: string;
  depth: number;
}

export function flattenLeaves(leaves: Leaf[], depth = 0): FlatLeaf[] {
  const result: FlatLeaf[] = [];
  for (const leaf of leaves) {
    result.push({ id: leaf.id, title: leaf.title, depth });
    if (leaf.children?.length) {
      result.push(...flattenLeaves(leaf.children, depth + 1));
    }
  }
  return result;
}