import { useState, useEffect, useCallback } from 'react';

interface FormData {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  senderAccount?: string;
  walletAddress?: string;
  sendMethod?: string;
  receiveMethod?: string;
  sendAmount?: string;
  receiveAmount?: string;
  exchangeRate?: number;
  rateDisplay?: string;
  dynamicLimits?: {
    minSendAmount: number;
    maxSendAmount: number;
    minReceiveAmount: number;
    maxReceiveAmount: number;
  };
  doNotRemember?: boolean;
  [key: string]: any;
}

interface SavedFormData {
  data: FormData;
  isReminded: boolean;
  timestamp: number;
  version: string;
}

const FORM_DATA_STORAGE_KEY = 'doogle_form_data';
const DATA_EXPIRY_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days (increased from 7)
const CURRENT_VERSION = '2.0';

export function useFormDataMemory(formKey: string = 'default') {
  const [isReminded, setIsReminded] = useState(true); // Default to true (save by default)
  const [savedData, setSavedData] = useState<FormData>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<number>(0);

  const storageKey = `${FORM_DATA_STORAGE_KEY}_${formKey}`;

  // Load saved data on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const savedFormData: SavedFormData = JSON.parse(stored);
        
        // Check if data hasn't expired and is compatible
        if (Date.now() - savedFormData.timestamp < DATA_EXPIRY_DURATION) {
          setSavedData(savedFormData.data);
          setIsReminded(savedFormData.isReminded);
          setLastSaved(savedFormData.timestamp);
          setIsLoaded(true);
          console.log('✅ Loaded saved form data:', savedFormData.data);
        } else {
          // Remove expired data
          localStorage.removeItem(storageKey);
          setIsLoaded(true);
          console.log('🗑️ Removed expired form data');
        }
      } else {
        setIsLoaded(true);
        console.log('📝 No saved form data found');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load saved form data:', error);
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Enhanced auto-save function with debouncing
  const autoSave = useCallback((data: Partial<FormData>) => {
    if (!isReminded) {
      console.log('🚫 Auto-save disabled - remind is off');
      return;
    }

    try {
      const now = Date.now();
      const updatedData = { ...savedData, ...data };
      
      const dataToSave: SavedFormData = {
        data: updatedData,
        isReminded: true,
        timestamp: now,
        version: CURRENT_VERSION
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setSavedData(updatedData);
      setLastSaved(now);
      
      console.log('💾 Auto-saved field:', Object.keys(data)[0], 'Value:', Object.values(data)[0]);
    } catch (error) {
      console.warn('❌ Failed to auto-save form data:', error);
    }
  }, [isReminded, savedData, storageKey]);

  // Save data to localStorage - enhanced to preserve ALL customer information
  const saveFormData = useCallback((data: FormData) => {
    if (!isReminded) return; // Only save if reminded

    try {
      // Ensure all customer data fields are preserved
      const completeData = {
        fullName: data.fullName || savedData.fullName || '',
        email: data.email || savedData.email || '',
        phoneNumber: data.phoneNumber || savedData.phoneNumber || '',
        senderAccount: data.senderAccount || savedData.senderAccount || '',
        walletAddress: data.walletAddress || savedData.walletAddress || '',
        sendMethod: data.sendMethod || savedData.sendMethod || '',
        receiveMethod: data.receiveMethod || savedData.receiveMethod || '',
        sendAmount: data.sendAmount || savedData.sendAmount || '',
        receiveAmount: data.receiveAmount || savedData.receiveAmount || '',
        exchangeRate: data.exchangeRate || savedData.exchangeRate || 0,
        rateDisplay: data.rateDisplay || savedData.rateDisplay || '',
        dynamicLimits: data.dynamicLimits || savedData.dynamicLimits || {
          minSendAmount: 5,
          maxSendAmount: 10000,
          minReceiveAmount: 5,
          maxReceiveAmount: 10000,
        },
        doNotRemember: data.doNotRemember || savedData.doNotRemember || false,
        ...data // Include any additional fields
      };

      const now = Date.now();
      const dataToSave: SavedFormData = {
        data: completeData,
        isReminded: true,
        timestamp: now,
        version: CURRENT_VERSION
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setSavedData(completeData);
      setLastSaved(now);
      console.log('💾 Customer data preserved with remind enabled:', completeData);
    } catch (error) {
      console.warn('❌ Failed to save form data:', error);
    }
  }, [isReminded, savedData, storageKey]);

  // Toggle remind status with complete customer data preservation
  const toggleRemind = useCallback((currentData?: FormData) => {
    const newRemindStatus = !isReminded;
    setIsReminded(newRemindStatus);

    if (newRemindStatus && currentData) {
      // Save ALL customer data when remind is enabled - preserve everything
      const completeCustomerData = {
        fullName: currentData.fullName || savedData.fullName || '',
        email: currentData.email || savedData.email || '',
        phoneNumber: currentData.phoneNumber || savedData.phoneNumber || '',
        senderAccount: currentData.senderAccount || savedData.senderAccount || '',
        walletAddress: currentData.walletAddress || savedData.walletAddress || '',
        sendMethod: currentData.sendMethod || savedData.sendMethod || '',
        receiveMethod: currentData.receiveMethod || savedData.receiveMethod || '',
        sendAmount: currentData.sendAmount || savedData.sendAmount || '',
        receiveAmount: currentData.receiveAmount || savedData.receiveAmount || '',
        exchangeRate: currentData.exchangeRate || savedData.exchangeRate || 0,
        rateDisplay: currentData.rateDisplay || savedData.rateDisplay || '',
        dynamicLimits: currentData.dynamicLimits || savedData.dynamicLimits || {
          minSendAmount: 5,
          maxSendAmount: 10000,
          minReceiveAmount: 5,
          maxReceiveAmount: 10000,
        },
        doNotRemember: currentData.doNotRemember || savedData.doNotRemember || false,
        ...currentData // Include any additional fields
      };

      const now = Date.now();
      const dataToSave: SavedFormData = {
        data: completeCustomerData,
        isReminded: true,
        timestamp: now,
        version: CURRENT_VERSION
      };
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        setSavedData(completeCustomerData);
        setLastSaved(now);
        console.log('✅ REMIND ENABLED: All customer information preserved permanently');
      } catch (error) {
        console.warn('❌ Failed to save form data:', error);
      }
    } else if (!newRemindStatus) {
      // Clear data when remind is disabled
      try {
        localStorage.removeItem(storageKey);
        setSavedData({});
        setLastSaved(0);
        console.log('🗑️ REMIND DISABLED: Customer data cleared');
      } catch (error) {
        console.warn('❌ Failed to clear form data:', error);
      }
    }
    
    return newRemindStatus;
  }, [isReminded, savedData, storageKey]);

  // Force clear all data (for immediate form reset)
  const forceRemoveData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setSavedData({});
      setIsReminded(false);
      setLastSaved(0);
      console.log('🗑️ Force removed all form data');
    } catch (error) {
      console.warn('❌ Failed to force clear form data:', error);
    }
  }, [storageKey]);

  // Clear all saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setSavedData({});
      setIsReminded(false);
      setLastSaved(0);
      console.log('🗑️ Cleared all saved form data');
    } catch (error) {
      console.warn('❌ Failed to clear form data:', error);
    }
  }, [storageKey]);

  // Update specific field in saved data with instant auto-save
  const updateSavedField = useCallback((field: string, value: any) => {
    if (!isReminded) {
      console.log(`🚫 Skipping save for ${field} - remind is disabled`);
      return;
    }

    try {
      const updatedData = { ...savedData, [field]: value };
      const now = Date.now();
      
      const dataToSave: SavedFormData = {
        data: updatedData,
        isReminded: true,
        timestamp: now,
        version: CURRENT_VERSION
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setSavedData(updatedData);
      setLastSaved(now);
      console.log(`💾 Instantly saved ${field}:`, value);
    } catch (error) {
      console.warn('❌ Failed to update saved field:', error);
    }
  }, [isReminded, savedData, storageKey]);

  // Get all saved data for complete form restoration
  const getAllSavedData = useCallback(() => {
    return savedData;
  }, [savedData]);

  // Check if data was saved recently (within last 5 minutes)
  const isRecentlySaved = useCallback(() => {
    return Date.now() - lastSaved < 5 * 60 * 1000;
  }, [lastSaved]);

  // Export data for backup
  const exportData = useCallback(() => {
    return {
      data: savedData,
      timestamp: lastSaved,
      version: CURRENT_VERSION
    };
  }, [savedData, lastSaved]);

  // Import data from backup
  const importData = useCallback((importedData: any) => {
    try {
      const dataToSave: SavedFormData = {
        data: importedData.data || {},
        isReminded: true,
        timestamp: Date.now(),
        version: CURRENT_VERSION
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setSavedData(importedData.data || {});
      setLastSaved(Date.now());
      console.log('📥 Imported form data successfully');
    } catch (error) {
      console.warn('❌ Failed to import form data:', error);
    }
  }, [storageKey]);

  return {
    isReminded,
    savedData,
    isLoaded,
    lastSaved,
    saveFormData,
    autoSave,
    toggleRemind,
    clearSavedData,
    updateSavedField,
    forceRemoveData,
    getAllSavedData,
    isRecentlySaved,
    exportData,
    importData,
    hasSavedData: Object.keys(savedData).some(key => savedData[key])
  };
}