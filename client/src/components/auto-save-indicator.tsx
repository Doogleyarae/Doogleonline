import { useState, useEffect } from 'react';
import { CheckCircle, Save, AlertCircle } from 'lucide-react';

interface AutoSaveIndicatorProps {
  isReminded: boolean;
  hasSavedData: boolean;
  lastSaved?: number;
  className?: string;
}

export function AutoSaveIndicator({ 
  isReminded, 
  hasSavedData, 
  lastSaved = 0,
  className = "" 
}: AutoSaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (lastSaved > 0) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved]);

  if (!isReminded) {
    return (
      <div className={`flex items-center gap-2 text-orange-600 text-sm ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span>Auto-save disabled</span>
      </div>
    );
  }

  if (showSaved) {
    return (
      <div className={`flex items-center gap-2 text-green-600 text-sm ${className}`}>
        <CheckCircle className="w-4 h-4" />
        <span>Saved automatically</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-blue-600 text-sm ${className}`}>
      <Save className="w-4 h-4" />
      <span>Auto-save enabled</span>
      {hasSavedData && <span className="text-xs text-gray-500">• Data restored</span>}
    </div>
  );
} 