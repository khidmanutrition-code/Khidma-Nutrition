import { useEffect, useRef, useState } from 'react';
import type React from 'react';

interface UseSwipeDragOptions {
  onNext: (steps?: number) => void;
  onPrev: (steps?: number) => void;
  onPauseChange?: (paused: boolean) => void;
  thresholdPx?: number;
  multiStepPx?: number;
}

export function useSwipeDrag({
  onNext,
  onPrev,
  onPauseChange,
  thresholdPx = 25,
  multiStepPx,
}: UseSwipeDragOptions) {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const callbacksRef = useRef({ onNext, onPrev, onPauseChange, thresholdPx, multiStepPx });
  callbacksRef.current = { onNext, onPrev, onPauseChange, thresholdPx, multiStepPx };

  const suppressClickRef = useRef(false);

  useEffect(() => {
    const el = containerEl;
    if (!el) return;

    const gesture = {
      active: false,
      mode: 'none' as 'none' | 'horizontal' | 'vertical',
      pointer: 'none' as 'none' | 'touch' | 'mouse',
      startX: 0,
      startY: 0,
      dx: 0,
    };

    const finishGesture = () => {
      if (!gesture.active) return;
      const wasHorizontal = gesture.mode === 'horizontal';
      const dx = gesture.dx;
      gesture.active = false;
      gesture.mode = 'none';
      gesture.pointer = 'none';
      gesture.dx = 0;

      setIsDragging(false);
      setDragX(0);
      callbacksRef.current.onPauseChange?.(false);

      if (wasHorizontal) {
        const { thresholdPx: th, multiStepPx: ms, onNext: next, onPrev: prev } =
          callbacksRef.current;
        const steps = ms && Math.abs(dx) > ms ? 2 : 1;
        if (dx <= -th) {
          next(steps);
        } else if (dx >= th) {
          prev(steps);
        }
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 100);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      gesture.active = true;
      gesture.mode = 'none';
      gesture.pointer = 'touch';
      gesture.startX = t.clientX;
      gesture.startY = t.clientY;
      gesture.dx = 0;
      suppressClickRef.current = false;
      callbacksRef.current.onPauseChange?.(true);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!gesture.active || gesture.pointer !== 'touch' || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - gesture.startX;
      const dy = t.clientY - gesture.startY;

      if (gesture.mode === 'none') {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        if (Math.abs(dx) >= Math.abs(dy)) {
          gesture.mode = 'horizontal';
          suppressClickRef.current = true;
          setIsDragging(true);
        } else {
          gesture.mode = 'vertical';
          gesture.active = false;
          callbacksRef.current.onPauseChange?.(false);
          return;
        }
      }

      if (gesture.mode === 'horizontal') {
        if (e.cancelable) e.preventDefault();
        gesture.dx = dx;
        setDragX(dx);
      }
    };

    const onTouchEnd = () => {
      if (gesture.pointer === 'touch') {
        finishGesture();
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      gesture.active = true;
      gesture.mode = 'none';
      gesture.pointer = 'mouse';
      gesture.startX = e.clientX;
      gesture.startY = e.clientY;
      gesture.dx = 0;
      suppressClickRef.current = false;
      callbacksRef.current.onPauseChange?.(true);
    };

    const onWindowMouseMove = (e: MouseEvent) => {
      if (!gesture.active || gesture.pointer !== 'mouse') return;
      const dx = e.clientX - gesture.startX;
      if (gesture.mode === 'none') {
        if (Math.abs(dx) < 5) return;
        gesture.mode = 'horizontal';
        suppressClickRef.current = true;
        setIsDragging(true);
      }
      if (gesture.mode === 'horizontal') {
        gesture.dx = dx;
        setDragX(dx);
      }
    };

    const onWindowMouseUp = () => {
      if (gesture.pointer === 'mouse') {
        finishGesture();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [containerEl]);

  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return {
    containerRef: setContainerEl,
    dragX,
    isDragging,
    onClickCapture,
  };
}
