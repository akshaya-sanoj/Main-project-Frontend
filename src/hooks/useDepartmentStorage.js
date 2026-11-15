import { useState, useEffect } from 'react';

export function useDepartmentStorage(key, initialValue, validate = () => true) {
  const [storedData, setStoredData] = useState({
    key: null,
    value: initialValue,
  });

  useEffect(() => {
    let loadedData = initialValue;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (validate(parsed)) {
          loadedData = parsed;
        }
      }
    } catch (error) {
      console.error('Error loading department data:', error);
    }
    setStoredData({ key, value: loadedData });
  }, [key, initialValue, validate]);

  useEffect(() => {
    if (storedData.key !== key) return;
    try {
      localStorage.setItem(key, JSON.stringify(storedData.value));
    } catch (error) {
      console.error('Error saving department data:', error);
    }
  }, [storedData, key]);

  const value = storedData.key === key ? storedData.value : initialValue;

  const setValue = (newValue) => {
    setStoredData((prev) => {
      const currentValue = prev.key === key ? prev.value : initialValue;
      return {
        key,
        value: typeof newValue === 'function' ? newValue(currentValue) : newValue,
      };
    });
  };

  return [value, setValue];
}