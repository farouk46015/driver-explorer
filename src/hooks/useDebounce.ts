import { useState, useEffect } from 'react';

export function useDebounce(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  return debouncedQuery;
}
