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
      <div
        className="flex items-center gap-4 p-4 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(77,161,255,0.08), rgba(139,92,246,0.08))',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          className="relative w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 flex-shrink-0 shadow-sm"
          style={{
            borderColor: 'var(--border-active)',
            background: 'var(--bg-surface-hover)',
          }}
        >
          <img
            src={customAvatarUrl || currentAvatarUrl}
            alt="Avatar selecionado"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 rounded-full ring-2"
            style={{ borderColor: 'var(--bg-surface)' }}
          />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Avatar selecionado
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
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
            className="ml-auto p-1.5 rounded-lg transition-all cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface-active)';
              e.currentTarget.style.color = '#FB7185';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            title="Remover foto personalizada"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Upload de imagem personalizada */}
      <div
        className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer"
        style={{
          borderColor: 'var(--border-color)',
          background: 'var(--bg-surface)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-active)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--bg-surface-hover)', color: 'var(--primary)' }}
        >
          <Upload className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-bold transition-colors cursor-pointer"
            style={{ color: 'var(--primary)' }}
          >
            Enviar foto própria
          </button>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            PNG, JPG ou GIF · Máx. 5MB
          </p>
        </div>
      </div>

      {/* Erro no upload */}
      {uploadError && (
        <div
          className="p-2.5 rounded-xl"
          style={{
            background: 'rgba(244,63,94,0.08)',
            border: '1px solid rgba(244,63,94,0.25)',
          }}
        >
          <p className="text-xs font-medium" style={{ color: '#FB7185' }}>
            {uploadError}
          </p>
        </div>
      )}

      <label className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Camera className="h-4 w-4" style={{ color: 'var(--primary)' }} /> Escolher Avatar
      </label>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {AVATAR_CATEGORIES.map((cat) => {
          const isSelectedCat = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 clickable`}
              style={{
                borderColor: isSelectedCat ? 'var(--border-active)' : 'var(--border-color)',
                background: isSelectedCat ? 'var(--bg-surface-hover)' : 'transparent',
              }}
            >
              <span className="text-base">{cat.icon}</span>
              <span
                className="text-xs font-bold"
                style={{ color: isSelectedCat ? 'var(--primary)' : 'var(--text-secondary)' }}
              >
                {cat.name}
              </span>
              <span className="text-[10px] ml-0.5" style={{ color: 'var(--text-secondary)' }}>
                {cat.variants.length}
              </span>
            </button>
          );
        })}
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
              className={`relative flex flex-col items-center gap-1 p-1.5 rounded-xl border-2 transition-all duration-150 clickable`}
              style={{
                borderColor: isSelected ? 'var(--border-active)' : 'var(--border-color)',
                background: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              }}
              title={variant.seed}
            >
              <div
                className={`w-10 h-10 rounded-lg overflow-hidden ${isSelected ? "ring-2" : ""}`}
                style={isSelected ? { ringColor: 'var(--primary)' } : {}}
              >
                <img
                  src={url}
                  alt={variant.seed}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm" style={{ background: 'var(--primary)' }}>
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              )}
              <span className="text-[8px] truncate max-w-full" style={{ color: 'var(--text-secondary)' }}>
                {variant.seed}
              </span>
            </button>
          );
        })}
      </div>

      {/* More categories collapsed */}
      <details className="group">
        <summary
          className="text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity list-none flex items-center gap-1 py-1"
          style={{ color: 'var(--primary)' }}
        >
          <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
          {AVATAR_CATEGORIES.length} categorias ·{" "}
          {AVATAR_CATEGORIES.reduce((a, c) => a + c.variants.length, 0)}{" "}
          avatares no total
        </summary>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 mt-2 p-3 rounded-xl"
          style={{
            background: 'var(--bg-surface-hover)',
            border: '1px solid var(--border-color)',
          }}
        >
          {AVATAR_CATEGORIES.map((cat) => {
            const previewUrl = getAvatarUrl(cat.style, cat.variants[0].seed);
            const isSelectedCat = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all cursor-pointer text-left min-w-0 clickable"
                style={{
                  borderColor: isSelectedCat ? 'var(--border-active)' : 'transparent',
                  background: isSelectedCat ? 'var(--bg-surface-active)' : 'transparent',
                }}
              >
                <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-surface)' }}>
                  <img
                    src={previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="text-[10px] font-semibold truncate" style={{ color: 'var(--text-secondary)' }}>
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
