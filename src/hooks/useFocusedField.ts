import { useState, useEffect, useCallback, useRef } from 'react';
import { ONBOARDING_HELP_DICTIONARY, FieldHelpItem } from '../data/onboardingHelpDictionary';

export interface UseFocusedFieldReturn {
  activeFieldKey: string | null;
  lastFocusedKey: string | null;
  activeHelpItem: FieldHelpItem | null;
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  toggleHelp: () => void;
  selectFieldForHelp: (key: string) => void;
  clearFocus: () => void;
  focusedElementRef: React.RefObject<HTMLElement | null>;
}

export function useFocusedField(defaultKey: string = 'shop_name'): UseFocusedFieldReturn {
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [lastFocusedKey, setLastFocusedKey] = useState<string>(defaultKey);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const focusedElementRef = useRef<HTMLElement | null>(null);

  // Helper to extract help key from element or parent element
  const getHelpKeyFromElement = (element: Element | null): string | null => {
    let current: Element | null = element;
    while (current && current !== document.body) {
      const key = current.getAttribute('data-help-key');
      if (key && ONBOARDING_HELP_DICTIONARY[key]) {
        return key;
      }
      current = current.parentElement;
    }
    return null;
  };

  // Listen to global focusin events to track focus without having to bind onFocus to every input
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const helpKey = getHelpKeyFromElement(target);
      if (helpKey) {
        setActiveFieldKey(helpKey);
        setLastFocusedKey(helpKey);
        focusedElementRef.current = target;
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      // If focus moves to something without a data-help-key, don't clear lastFocusedKey,
      // but note that no element has active cursor focus right now
      const related = event.relatedTarget as HTMLElement;
      const nextKey = getHelpKeyFromElement(related);
      if (!nextKey) {
        setActiveFieldKey(null);
      }
    };

    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);

    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
    };
  }, []);

  // Keyboard shortcut listener (Shift + ? or F1 or Ctrl/Cmd + /)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Avoid triggering when user is simply typing '?' into an input field without modifier keys
      // Shift + ? is standard Help shortcut, or F1, or Ctrl + /
      const isShiftQuestion = event.shiftKey && (event.key === '?' || event.key === '/');
      const isF1 = event.key === 'F1';
      const isCtrlSlash = (event.ctrlKey || event.metaKey) && event.key === '/';

      if (isShiftQuestion || isF1 || isCtrlSlash) {
        // If user is inside an input and presses Shift+?, check if they just wanted the character '?'
        // Allow F1 and Ctrl+/ unconditionally, but for Shift+?, trigger help
        if (isF1 || isCtrlSlash) {
          event.preventDefault();
          setIsHelpOpen((prev) => !prev);
        }
      }

      // Escape key closes help drawer if open
      if (event.key === 'Escape' && isHelpOpen) {
        setIsHelpOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpOpen]);

  const toggleHelp = useCallback(() => {
    setIsHelpOpen((prev) => !prev);
  }, []);

  const selectFieldForHelp = useCallback((key: string) => {
    if (ONBOARDING_HELP_DICTIONARY[key]) {
      setLastFocusedKey(key);
      setActiveFieldKey(key);
      setIsHelpOpen(true);

      // Attempt to find element in DOM and focus it smoothly
      const el = document.querySelector(`[data-help-key="${key}"]`) as HTMLElement;
      if (el) {
        el.focus({ preventScroll: false });
      }
    }
  }, []);

  const clearFocus = useCallback(() => {
    setActiveFieldKey(null);
  }, []);

  // Resolve current active item
  const resolvedKey = activeFieldKey || lastFocusedKey;
  const activeHelpItem = resolvedKey ? ONBOARDING_HELP_DICTIONARY[resolvedKey] || null : null;

  return {
    activeFieldKey,
    lastFocusedKey,
    activeHelpItem,
    isHelpOpen,
    setIsHelpOpen,
    toggleHelp,
    selectFieldForHelp,
    clearFocus,
    focusedElementRef,
  };
}
