import React from "react";
import { Camera, Check, ChevronRight } from "lucide-react";
import { AVATAR_CATEGORIES, getAvatarUrl } from "./avatarCategories";

interface AvatarSelectorProps {
  selectedCategory: string;
  selectedVariant: string;
  onSelect: (catId: string, variantId: string) => void;
  onCategoryChange: (catId: string) => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedCategory,
  selectedVariant,
  onSelect,
  onCategoryChange,
}) => {
  const currentCategory =
    AVATAR_CATEGORIES.find((c) => c.id === selectedCategory) ||
    AVATAR_CATEGORIES[0];
  return (
    <div className="flex flex-col gap-4">
      {/* Preview do avatar atual */}
      <div className="flex items-center gap-4">
        {/* <div className="relative w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center overflow-hidden border-2 border-brand-200 dark:border-brand-800 flex-shrink-0">
          <img
            src={currentAvatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 rounded-full ring-2 ring-white/50 dark:ring-dark-900/50" />
        </div> */}
      </div>

      <label className="text-sm font-bold text-slate-700 dark:text-dark-200 flex items-center gap-2">
        <Camera className="h-4 w-4 text-brand-500" /> Escolher Avatar
      </label>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {AVATAR_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              selectedCategory === cat.id
                ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20 ring-1 ring-brand-200 dark:ring-brand-800"
                : "border-slate-100 dark:border-dark-800 hover:border-slate-300 dark:hover:border-dark-600"
            }`}
          >
            <span className="text-base">{cat.icon}</span>
            <span
              className={`text-xs font-bold ${
                selectedCategory === cat.id
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-slate-600 dark:text-dark-300"
              }`}
            >
              {cat.name}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-dark-500 ml-0.5">
              {cat.variants.length}
            </span>
          </button>
        ))}
      </div>

      {/* Variants Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
        {currentCategory.variants.map((variant) => {
          const isSelected = selectedVariant === variant.id;
          const url = getAvatarUrl(currentCategory.style, variant.seed);
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(currentCategory.id, variant.id)}
              className={`relative flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20 ring-2 ring-brand-200 dark:ring-brand-800 scale-105"
                  : "border-slate-100 dark:border-dark-800 hover:border-slate-300 dark:hover:border-dark-600 hover:bg-slate-50 dark:hover:bg-dark-900"
              }`}
              title={variant.seed}
            >
              <div
                className={`w-10 h-10 rounded-lg overflow-hidden ${isSelected ? "ring-2 ring-brand-300" : ""}`}
              >
                <img
                  src={url}
                  alt={variant.seed}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-brand-500 flex items-center justify-center shadow-sm">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              )}
              <span className="text-[8px] text-slate-400 dark:text-dark-500 truncate max-w-full">
                {variant.seed}
              </span>
            </button>
          );
        })}
      </div>

      {/* More categories collapsed */}
      <details className="group">
        <summary className="text-xs font-semibold text-brand-500 cursor-pointer hover:text-brand-600 transition-colors list-none flex items-center gap-1 py-1">
          <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
          {AVATAR_CATEGORIES.length} categorias ·{" "}
          {AVATAR_CATEGORIES.reduce((a, c) => a + c.variants.length, 0)}{" "}
          avatares no total
        </summary>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 mt-2 p-3 bg-slate-50 dark:bg-dark-950/30 rounded-xl">
          {AVATAR_CATEGORIES.map((cat) => {
            const previewUrl = getAvatarUrl(cat.style, cat.variants[0].seed);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all cursor-pointer text-left min-w-0 ${
                  selectedCategory === cat.id
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20"
                    : "border-transparent hover:bg-white dark:hover:bg-dark-800/60"
                }`}
              >
                <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0 bg-white dark:bg-dark-900">
                  <img
                    src={previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-600 dark:text-dark-300 truncate">
                  {cat.icon} {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
};

export default AvatarSelector;
