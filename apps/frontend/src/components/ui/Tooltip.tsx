import React, { useState, useId, useRef, useCallback } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

type PositionKey = NonNullable<TooltipProps['position']>;

const POSITION_OFFSETS: Record<PositionKey, { x: number; y: number; transform: string }> = {
  top: {
    x: 0.5,
    y: -8,
    transform: 'translateX(-50%) translateY(-100%)',
  },
  bottom: {
    x: 0.5,
    y: 8,
    transform: 'translateX(-50%) translateY(0%)',
  },
  left: {
    x: -8,
    y: 0.5,
    transform: 'translateX(-100%) translateY(-50%)',
  },
  right: {
    x: 8,
    y: 0.5,
    transform: 'translateX(0%) translateY(-50%)',
  },
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tooltipId = useId();
  const triggerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const offset = POSITION_OFFSETS[position];
    const { x, y } = offset;

    let top: number;
    let left: number;

    if (position === 'top' || position === 'bottom') {
      top = position === 'top' ? rect.top + y : rect.bottom + y;
      left = rect.left + rect.width * x;
    } else {
      top = rect.top + rect.height * y;
      left = position === 'left' ? rect.left + x : rect.right + x;
    }

    setCoords({ top, left });
    setIsVisible(true);
  }, [position]);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <div
      className="relative flex w-full"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <div ref={triggerRef} className="w-full" aria-describedby={tooltipId}>
        {children}
      </div>

      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="fixed z-[9999] pointer-events-none"
          style={{
            top: coords.top,
            left: coords.left,
            transform: POSITION_OFFSETS[position].transform,
          }}
        >
          <div className="bg-zinc-800 dark:bg-zinc-800 text-white text-xs font-medium px-3 py-2 rounded-xl shadow-lg whitespace-normal max-w-[220px] text-center leading-relaxed">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
