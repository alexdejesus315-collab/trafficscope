import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Hook reutilizável: ao premir Esc, volta à página anterior do histórico.
// Usar apenas em páginas standalone (sem modais próprios que já tratam o Esc).
export function useEscapeGoBack() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        navigate(-1);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}