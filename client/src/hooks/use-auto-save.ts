import { useCallback, useEffect, useRef } from 'react';
import { useFormDataMemory } from './use-form-data-memory';

interface AutoSaveOptions {
  formKey?: string;
  debounceMs?: number;
  saveOnBlur?: boolean;
  saveOnChange?: boolean;
  saveOnSubmit?: boolean;
  restoreOnMount?: boolean;
}

export function useAutoSave<T extends Record<string, any>>(
  formData: T,
  options: AutoSaveOptions = {}
) {
  const {
    formKey = 'default',
    debounceMs = 300,
    saveOnBlur = true,
    saveOnChange = true,
    saveOnSubmit = true,
    restoreOnMount = true
  } = options;

  const {
    isReminded,
    savedData,
    isLoaded,
    autoSave,
    updateSavedField,
    getAllSavedData,
    clearSavedData,
    hasSavedData
  } = useFormDataMemory(formKey);

  const debounceRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<T>({} as T);

  // Debounced auto-save function
  const debouncedSave = useCallback((data: Partial<T>) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (isReminded) {
        autoSave(data);
        lastSavedRef.current = { ...lastSavedRef.current, ...data };
      }
    }, debounceMs);
  }, [autoSave, isReminded, debounceMs]);

  // Instant save function
  const saveImmediately = useCallback((data: Partial<T>) => {
    if (isReminded) {
      autoSave(data);
      lastSavedRef.current = { ...lastSavedRef.current, ...data };
    }
  }, [autoSave, isReminded]);

  // Save specific field
  const saveField = useCallback((field: keyof T, value: T[keyof T]) => {
    if (isReminded) {
      updateSavedField(field as string, value);
      lastSavedRef.current = { ...lastSavedRef.current, [field]: value };
    }
  }, [isReminded, updateSavedField]);

  // Save all current form data
  const saveAll = useCallback(() => {
    if (isReminded) {
      autoSave(formData);
      lastSavedRef.current = { ...formData };
    }
  }, [isReminded, autoSave, formData]);

  // Restore all saved data
  const restoreAll = useCallback(() => {
    if (isLoaded && hasSavedData) {
      return getAllSavedData();
    }
    return null;
  }, [isLoaded, hasSavedData, getAllSavedData]);

  // Clear all saved data
  const clearAll = useCallback(() => {
    clearSavedData();
    lastSavedRef.current = {} as T;
  }, [clearSavedData]);

  // Auto-save on form data changes
  useEffect(() => {
    if (saveOnChange && isReminded && Object.keys(formData).length > 0) {
      // Only save if data has actually changed
      const hasChanged = Object.keys(formData).some(key => 
        formData[key as keyof T] !== lastSavedRef.current[key as keyof T]
      );

      if (hasChanged) {
        debouncedSave(formData);
      }
    }
  }, [formData, saveOnChange, isReminded, debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    // State
    isReminded,
    isLoaded,
    hasSavedData,
    savedData,
    
    // Actions
    saveImmediately,
    saveField,
    saveAll,
    restoreAll,
    clearAll,
    debouncedSave,
    
    // Utilities
    getAllSavedData,
    lastSaved: lastSavedRef.current
  };
} 