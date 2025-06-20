
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  if (!showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white border border-blue-200 rounded-lg shadow-lg p-4 flex items-center gap-3 z-50 md:left-auto md:right-4 md:w-80">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">Install IzzyCRM</h3>
        <p className="text-sm text-gray-600">Add to your home screen for quick access</p>
      </div>
      <Button onClick={handleInstallClick} size="sm" className="shrink-0">
        <Download className="w-4 h-4 mr-1" />
        Install
      </Button>
      <Button onClick={handleDismiss} variant="ghost" size="sm" className="shrink-0">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
