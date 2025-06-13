import { useEffect } from 'react';
import { useLocation } from 'wouter';

interface ScrollPosition {
  x: number;
  y: number;
  path: string;
  timestamp: number;
}

const SCROLL_STORAGE_KEY = 'doogle_scroll_positions';
const SCROLL_MEMORY_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function useScrollMemory() {
  const [location] = useLocation();

  // Save scroll position
  const saveScrollPosition = () => {
    const position: ScrollPosition = {
      x: window.scrollX,
      y: window.scrollY,
      path: location,
      timestamp: Date.now()
    };

    try {
      const stored = localStorage.getItem(SCROLL_STORAGE_KEY);
      const positions: ScrollPosition[] = stored ? JSON.parse(stored) : [];
      
      // Remove old positions and current path
      const filtered = positions.filter(p => 
        p.path !== location && 
        Date.now() - p.timestamp < SCROLL_MEMORY_DURATION
      );
      
      // Add current position
      filtered.push(position);
      
      localStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.warn('Failed to save scroll position:', error);
    }
  };

  // Restore scroll position
  const restoreScrollPosition = () => {
    try {
      const stored = localStorage.getItem(SCROLL_STORAGE_KEY);
      if (!stored) return;

      const positions: ScrollPosition[] = JSON.parse(stored);
      const position = positions.find(p => p.path === location);
      
      if (position && Date.now() - position.timestamp < SCROLL_MEMORY_DURATION) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          window.scrollTo({
            left: position.x,
            top: position.y,
            behavior: 'auto' // Instant scroll on restore
          });
        });
      }
    } catch (error) {
      console.warn('Failed to restore scroll position:', error);
    }
  };

  // Save scroll position on scroll
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(saveScrollPosition, 100); // Debounce scroll saves
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [location]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location]);

  // Restore on location change
  useEffect(() => {
    const timeoutId = setTimeout(restoreScrollPosition, 100); // Small delay for DOM update
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [location]);

  return {
    saveScrollPosition,
    restoreScrollPosition
  };
}