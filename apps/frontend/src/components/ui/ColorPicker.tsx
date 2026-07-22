import React from 'react';

interface ColorPickerProps {
  colors: readonly string[];
  selectedColor: string;
  onChange: (color: string) => void;
  label?: string;
}

/**
 * ColorPicker — Seletor de cores por círculos.
 * Consolida duplicação entre DashboardView, NotebookView, TagsManagementView.
 *
 * @example
 * <ColorPicker
 *   colors={NOTEBOOK_COLORS}
 *   selectedColor={selectedColor}
 *   onChange={setSelectedColor}
 *   label="Cor de Identificação"
 * />
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  selectedColor,
  onChange,
  label,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-dark-200">
          {label}
        </label>
      )}
      <div className="flex gap-3 flex-wrap">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-8 h-8 rounded-full border-2 transition-transform duration-200 hover:scale-110 cursor-pointer ${
              selectedColor === color
                ? 'border-slate-800 dark:border-white scale-110'
                : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Selecionar cor ${color}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
