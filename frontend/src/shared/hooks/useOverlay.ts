import { useEffect } from 'react';

/**
 * Hook to handle Escape key press to close overlays/modals
 */
export function useEscapeKey(enabled: boolean, callback: () => void) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, callback]);
}

/**
 * Hook to trap focus within a container (for modals/drawers)
 */
export function useFocusTrap(
  enabled: boolean,
  containerRef: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled], textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element when trap becomes active
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [enabled, containerRef]);
}

/**
 * Hook to prevent body scroll when overlay is open
 */
export function useLockScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [enabled]);
}

/**
 * Hook to handle click outside a ref to close
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  callback: () => void
) {
  useEffect(() => {
    if (!enabled || !ref.current) return;

    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };

    // Delay to avoid triggering on the same click that opened
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClick, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClick, true);
    };
  }, [enabled, ref, callback]);
}