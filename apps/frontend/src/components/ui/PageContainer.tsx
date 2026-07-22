import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  /** Gap between children. Default: '6' (1.5rem) */
  gap?: "4" | "6" | "8" | "10";
  /** Additional classes */
  className?: string;
  /** HTML element to render. Default: 'div' */
  as?: "div" | "section" | "main" | "article";
}

/**
 * PageContainer — Layout wrapper padronizado para todas as telas.
 *
 * Centraliza o padrão `max-w-4xl mx-auto flex flex-col gap-{gap}`
 * para evitar repetição e facilitar mudanças futuras de layout.
 *
 * @example
 * ```tsx
 * <PageContainer>
 *   <h1>Conteúdo</h1>
 * </PageContainer>
 *
 * <PageContainer gap="8">
 *   <h1>Dashboard</h1>
 * </PageContainer>
 * ```
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  gap = "6",
  className = "",
  as: Tag = "div",
}) => {
  const gapClass = `gap-${gap}`;

  return (
    <Tag
      className={`max-w-4xl mx-auto flex flex-col ${gapClass} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
};

export default PageContainer;
