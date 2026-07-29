import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";

interface ReviewFinishedScreenProps {
  correctCount: number;
  totalItems: number;
  onNewReview: () => void;
  onOtherStudy: () => void;
}

export const ReviewFinishedScreen: React.FC<ReviewFinishedScreenProps> = ({
  correctCount,
  totalItems,
  onNewReview,
  onOtherStudy,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/studies"
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-dark-300 hover:text-brand-500 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos Estudos
      </Link>
      <Card className="p-8 text-center">
        <CheckCircle className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
        <h3 className="text-2xl font-heading font-bold text-slate-800 dark:text-dark-50 mb-2">
          Revisão Concluída!
        </h3>
        <p className="text-4xl font-bold text-brand-500 mb-1">
          {correctCount}/{totalItems}
        </p>
        <p className="text-sm text-slate-500 dark:text-dark-400 mb-6">
          {totalItems > 0
            ? ((correctCount / totalItems) * 100).toFixed(0)
            : 0}
          % de aproveitamento
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={onNewReview} variant="secondary">
            Nova Revisão
          </Button>
          <Button onClick={onOtherStudy}>Outro Estudo</Button>
        </div>
      </Card>
    </div>
  );
};
