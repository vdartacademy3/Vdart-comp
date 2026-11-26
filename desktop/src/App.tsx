import React, { useEffect } from 'react';
import { CompanionOverlay } from './components/CompanionOverlay';
import { useCompanionStore } from './stores/companionStore';

export const App: React.FC = () => {
  const { isChatOpen, setIsChatOpen, isDashboardOpen, setIsDashboardOpen, hydrateDesktopPersistence } = useCompanionStore();

  useEffect(() => {
    void hydrateDesktopPersistence();
  }, [hydrateDesktopPersistence]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDashboardOpen) {
          setIsDashboardOpen(false);
        } else if (isChatOpen) {
          setIsChatOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen, isDashboardOpen, setIsChatOpen, setIsDashboardOpen]);

  return (
    <div className="w-full h-full bg-transparent overflow-hidden">
      <CompanionOverlay />
    </div>
  );
};

export default App;
