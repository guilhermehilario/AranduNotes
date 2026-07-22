import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, ChevronRight, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Card } from '../../../components/ui/Card.tsx';
import { getTagColor } from '../../tags/constants';

interface LeafTag {
  tag: {
    id: string;
    name: string;
    color: string;
  };
}

export interface LeafCardData {
  id: string;
  title: string;
  updatedAt: string | Date;
  tags?: LeafTag[];
  children?: LeafCardData[];
}

interface LeafCardProps {
  leaf: LeafCardData;
  notebookId: string;
  onCreateSubLeaf: () => void;
}

export const LeafCard: React.FC<LeafCardProps> = ({ leaf, notebookId, onCreateSubLeaf }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = leaf.children && leaf.children.length > 0;

  return (
    <div className="flex flex-col gap-1">
      <Card
        hoverable
        onClick={() => navigate(`/notebooks/${notebookId}/leaves/${leaf.id}`)}
        className="flex items-center gap-4 p-4 border border-slate-100 dark:border-dark-800"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-800 flex items-center justify-center text-slate-500 dark:text-dark-300 flex-shrink-0">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-heading font-bold truncate text-slate-800 dark:text-dark-50">
              {leaf.title}
            </h4>
            {/* Tags */}
            {leaf.tags && leaf.tags.length > 0 && (
              <div className="flex gap-1 flex-shrink-0">
                {leaf.tags.slice(0, 3).map((lt) => (
                  <span
                    key={lt.tag.id}
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: getTagColor(lt.tag.color, lt.tag.name) }}
                    title={lt.tag.name}
                  />
                ))}
                {leaf.tags.length > 3 && (
                  <span className="text-[10px] text-slate-400">+{leaf.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-dark-400 mt-1 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Atualizado em {new Date(leaf.updatedAt).toLocaleDateString('pt-BR')}
            {hasChildren && (
              <span className="text-brand-500 ml-1">
                · {leaf.children!.length} sub-folha(s)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-400 cursor-pointer"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCreateSubLeaf();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-400 hover:text-brand-500 cursor-pointer"
            title="Criar sub-folha"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <ChevronRight className="h-5 w-5 text-slate-400 dark:text-dark-500 flex-shrink-0" />
        </div>
      </Card>

      {/* Sub-folhas (children) */}
      {hasChildren && expanded && (
        <div className="ml-6 flex flex-col gap-1 pl-4 border-l-2 border-slate-100 dark:border-dark-800">
          {leaf.children!.map((child) => (
            <Card
              key={child.id}
              hoverable
              onClick={() => navigate(`/notebooks/${notebookId}/leaves/${child.id}`)}
              className="flex items-center gap-3 p-3 border border-slate-100 dark:border-dark-800"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-dark-800 flex items-center justify-center text-slate-400 dark:text-dark-300 flex-shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-grow min-w-0">
                <h5 className="font-heading font-semibold text-sm truncate text-slate-700 dark:text-dark-100">
                  {child.title}
                </h5>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 dark:text-dark-500 flex-shrink-0" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeafCard;
