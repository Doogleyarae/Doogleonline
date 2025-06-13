import { useState, useEffect } from 'react';

interface FormData {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  walletAddress?: string;
  [key: string]: any;
}

interface SavedFormData {
  data: FormData;
  isReminded: boolean;
  timestamp: number;
}

const FORM_DATA_STORAGE_KEY = 'doogle_form_data';
const DATA_EXPIRY_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useFormDataMemory(formKey: string = 'default') {
  const [isReminded, setIsReminded] = useState(false);
  const [savedData, setSavedData] = useState<FormData>({});

  const storageKey = `${FORM_DATA_STORAGE_KEY}_${formKey}`;

  // Load saved data on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const savedFormData: SavedFormData = JSON.parse(stored);
        
        // Check if data hasn't expired
        if (Date.now() - savedFormData.timestamp < DATA_EXPIRY_DURATION) {
          setSavedData(savedFormData.data);
          setIsReminded(savedFormData.isReminded);
        } else {
          // Remove expired data
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.warn('Failed to load saved form data:', error);
    }
  }, [storageKey]);

  // Save data to localStorage
  const saveFormData = (data: FormData) => {
    if (!isReminded) return; // Only save if reminded

    try {
      const dataToSave: SavedFormData = {
        data,
        isReminded: true,
        timestamp: Date.now()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setSavedData(data);
    } catch (error) {
      console.warn('Failed to save form data:', error);
    }
  };

  // Toggle remind status with complete data control
  const toggleRemind = (currentData?: FormData) => {
    const newRemindStatus = !isReminded;
    setIsReminded(newRemindStatus);

    if (newRemindStatus && currentData) {
      // Save data when remind is enabled
      const dataToSave: SavedFormData = {
        data: currentData,
        isReminded: true,
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        setSavedData(currentData);
      } catch (error) {
        console.warn('Failed to save form data:', error);
      }
    } else if (!newRemindStatus) {
      // Clear data when remind is disabled
      try {
        localStorage.removeItem(storageKey);
        setSavedData({});
      } catch (error) {
        console.warn('Failed to clear form data:', error);
      }
    }
    
    return newRemindStatus;
  };

  // Force clear all data (for immediate form reset)
  const forceRemoveData = () => {
    try {
      localStorage.removeItem(storageKey);
      setSavedData({});
      setIsReminded(false);
    } catch (error) {
      console.warn('Failed to force clear form data:', error);
    }
  };

  // Clear all saved data
  const clearSavedData = () => {
    try {
      localStorage.removeItem(storageKey);
      setSavedData({});
      setIsReminded(false);
    } catch (error) {
      console.warn('Failed to clear form data:', error);
    }
  };

  // Update specific field in saved data
  const updateSavedField = (field: string, value: any) => {
    if (!isReminded) return;

    const updatedData = { ...savedData, [field]: value };
    saveFormData(updatedData);
  };

  return {
    isReminded,
    savedData,
    saveFormData,
    toggleRemind,
    clearSavedData,
    updateSavedField,
    forceRemoveData,
    hasSavedData: Object.keys(savedData).some(key => savedData[key])
  };
}