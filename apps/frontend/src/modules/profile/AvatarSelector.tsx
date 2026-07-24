import React, { useRef, useState } from "react";
import { Camera, Check, ChevronRight, Upload, X } from "lucide-react";
import { AVATAR_CATEGORIES, getAvatarUrl } from "./avatarCategories";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

interface AvatarSelectorProps {
  selectedCategory: string;
  selectedVariant: string;
  onSelect: (catId: string, variantId: string) => void;
  onCategoryChange: (catId: string) => void;
  customAvatarUrl?: string | null;
  onCustomUpload?: (dataUrl: string) => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedCategory,
  selectedVariant,
  onSelect,
  onCategoryChange,
  customAvatarUrl,
  onCustomUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const currentCategory =
    AVATAR_CATEGORIES.find((c) => c.id === selectedCategory) ||
    AVATAR_CATEGORIES[0];
  const currentVariant =
    currentCategory.variants.find((v) => v.id === selectedVariant) ||
    currentCategory.variants[0];
  const currentAvatarUrl = getAvatarUrl(currentCategory.style, currentVariant.seed);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Selecione apenas arquivos de imagem.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError("A imagem deve ter no máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onCustomUpload?.(dataUrl);
    };
    reader.onerror = () => {
      setUploadError("Erro ao ler o arquivo. Tente novamente.");
    };
    reader.readAsDataURL(file);

    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Preview do avatar selecionado */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-brand-50/50 to-purple-50/50 dark:from-brand-950/10 dark:to-purple-950/10 border border-brand-100 dark:border-brand-900/30">
        <div className="relative w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center overflow-hidden border-2 border-brand-300 dark:border-brand-700 flex-shrink-0 shadow-sm">
          <img
            src={customAvatarUrl || currentAvatarUrl}
            alt="Avatar selecionado"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 rounded-full ring-2 ring-white/50 dark:ring-dark-900/50" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-dark-100">
            Avatar selecionado
          </p>
          <p className="text-[11px] text-slate-500 dark:text-dark-400 mt-0.5">
            {customAvatarUrl
              ? "📸 Sua foto"
              : `${currentCategory.icon} ${currentCategory.name} · ${currentVariant.seed}`
            }
          </p>
        </div>
        {customAvatarUrl && (
          <button
            type="button"
            onClick={() => onCustomUpload?.("")}
            className="ml-auto p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
            title="Remover foto personalizada"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Upload de imagem personalizada */}
      <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-dark-700 hover:border-brand-300 dark:hover:border-brand-700 transition-all bg-slate-50/50 dark:bg-dark-950/20">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/20 flex items-center justify-center flex-shrink-0">
          <Upload className="h-5 w-5 text-brand-500" />
        </div>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors cursor-pointer"
          >
            Enviar foto própria
          </button>
          <p className="text-[10px] text-slate-400 dark:text-dark-500 mt-0.5">
            PNG, JPG ou GIF · Máx. 5MB
          </p>
        </div>
      </div>

      {/* Erro no upload */}
      {uploadError && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30">
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {uploadError}
          </p>
        </div>
      )}

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
