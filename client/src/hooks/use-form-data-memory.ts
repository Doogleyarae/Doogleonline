import { useState, useEffect } from 'react';

interface FormData {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  walletAddress?: string;
  sendMethod?: string;
  receiveMethod?: string;
  sendAmount?: string;
  receiveAmount?: string;
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

  // Save data to localStorage - enhanced to preserve ALL customer information
  const saveFormData = (data: FormData) => {
    if (!isReminded) return; // Only save if reminded

    try {
      // Ensure all customer data fields are preserved
      const completeData = {
        fullName: data.fullName || savedData.fullName || '',
        email: data.email || savedData.email || '',
        phoneNumber: data.phoneNumber || savedData.phoneNumber || '',
        walletAddress: data.walletAddress || savedData.walletAddress || '',
        ...data // Include any additional fields
      };

      const dataToSave: SavedFormData = {
        data: completeData,
        isReminded: true,
        timestamp: Date.now()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setSavedData(completeData);
      console.log('Customer data preserved with remind enabled');
    } catch (error) {
      console.warn('Failed to save form data:', error);
    }
  };

  // Toggle remind status with complete customer data preservation
  const toggleRemind = (currentData?: FormData) => {
    const newRemindStatus = !isReminded;
    setIsReminded(newRemindStatus);

    if (newRemindStatus && currentData) {
      // Save ALL customer data when remind is enabled - preserve everything
      const completeCustomerData = {
        fullName: currentData.fullName || savedData.fullName || '',
        email: currentData.email || savedData.email || '',
        phoneNumber: currentData.phoneNumber || savedData.phoneNumber || '',
        walletAddress: currentData.walletAddress || savedData.walletAddress || '',
        sendMethod: currentData.sendMethod || savedData.sendMethod || '',
        receiveMethod: currentData.receiveMethod || savedData.receiveMethod || '',
        sendAmount: currentData.sendAmount || savedData.sendAmount || '',
        receiveAmount: currentData.receiveAmount || savedData.receiveAmount || '',
        ...currentData // Include any additional fields
      };

      const dataToSave: SavedFormData = {
        data: completeCustomerData,
        isReminded: true,
        timestamp: Date.now()
      };
      
      try {
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        setSavedData(completeCustomerData);
        console.log('REMIND ENABLED: All customer information preserved permanently');
      } catch (error) {
        console.warn('Failed to save form data:', error);
      }
    } else if (!newRemindStatus) {
      // Clear data when remind is disabled
      try {
        localStorage.removeItem(storageKey);
        setSavedData({});
        console.log('REMIND DISABLED: Customer data cleared');
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