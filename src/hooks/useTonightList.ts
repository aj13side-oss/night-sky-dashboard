import { useState, useEffect, useCallback } from "react";

const KEY = "cosmicframe_tonight_list";

export function useTonightList() {
  const [list, setList] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(list));
  }, [list]);

  const addObject = useCallback((catalogId: string) => {
    setList((prev) => (prev.includes(catalogId) ? prev : [...prev, catalogId]));
  }, []);

  const removeObject = useCallback((catalogId: string) => {
    setList((prev) => prev.filter((id) => id !== catalogId));
  }, []);

  const isInList = useCallback(
    (catalogId: string) => list.includes(catalogId),
    [list]
  );

  const clearList = useCallback(() => setList([]), []);

  return { list, addObject, removeObject, isInList, clearList };
}
