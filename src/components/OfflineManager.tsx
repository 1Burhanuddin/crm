import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Wifi, WifiOff } from 'lucide-react';

interface OfflineData {
  id: string;
  type: 'bill' | 'order' | 'customer' | 'transaction';
  data: any;
  timestamp: number;
}

export function OfflineManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<OfflineData[]>([]);

  useEffect(() => {
    // Load offline data from localStorage
    const savedQueue = localStorage.getItem('offline-queue');
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue));
    }

    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back online",
        description: "Syncing your data...",
      });
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You're offline",
        description: "Data will be saved locally and synced when online",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToOfflineQueue = (type: OfflineData['type'], data: any) => {
    const newItem: OfflineData = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: Date.now(),
    };

    const updatedQueue = [...offlineQueue, newItem];
    setOfflineQueue(updatedQueue);
    localStorage.setItem('offline-queue', JSON.stringify(updatedQueue));

    toast({
      title: "Saved offline",
      description: "Will sync when you're back online",
    });
  };

  const syncOfflineData = async () => {
    if (offlineQueue.length === 0) return;

    // Here you would implement the actual syncing logic
    // This is a simplified version
    try {
      for (const item of offlineQueue) {
        // Sync each item based on its type
        console.log('Syncing:', item);
        // Add your supabase sync logic here
      }

      // Clear the queue after successful sync
      setOfflineQueue([]);
      localStorage.removeItem('offline-queue');

      toast({
        title: "Data synced",
        description: "All offline data has been synced successfully",
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Some data couldn't be synced. Will retry later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {!isOnline && (
        <div className="bg-destructive text-destructive-foreground px-3 py-2 rounded-md flex items-center gap-2 text-sm">
          <WifiOff className="h-4 w-4" />
          Offline Mode
          {offlineQueue.length > 0 && (
            <span className="bg-background text-foreground px-2 py-1 rounded text-xs">
              {offlineQueue.length} pending
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Hook to use offline functionality
export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveOfflineData = (type: string, data: any) => {
    if (!isOnline) {
      const offlineData = {
        id: Date.now().toString(),
        type,
        data,
        timestamp: Date.now(),
      };

      const existing = JSON.parse(localStorage.getItem('offline-queue') || '[]');
      existing.push(offlineData);
      localStorage.setItem('offline-queue', JSON.stringify(existing));

      return true; // Indicates data was saved offline
    }
    return false; // Indicates normal online operation
  };

  return { isOnline, saveOfflineData };
}