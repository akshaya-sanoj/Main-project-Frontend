import { useState, useEffect, useRef } from 'react';

export function useDepartmentStorage(key, initialValue) {
  const initialRef = useRef(initialValue);

  const readValue = () => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch {
      // ignore storage read errors
    }
    return initialRef.current;
  };

  const [value, setValue] = useState(readValue);

  useEffect(() => {
    setValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore storage write errors
    }
  }, [key, value]);

  return [value, setValue];
}