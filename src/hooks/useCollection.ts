import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useCollection<T extends { id: string }>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);
    let unsub = () => {};

    const handleQueryError = async (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      try {
        const snap = await getDocs(q);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
        setData(items);
      } catch (fallbackErr) {
        setError(
          fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
        );
      } finally {
        setLoading(false);
      }
    };

    try {
      unsub = onSnapshot(
        q,
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
          setData(items);
          setLoading(false);
        },
        (err) => {
          void handleQueryError(err);
        }
      );
    } catch (err) {
      void handleQueryError(err);
    }

    return unsub;
  }, [collectionName, JSON.stringify(constraints.map((c) => c.type))]);

  return { data, loading, error };
}

export { orderBy, query, where, limit } from "firebase/firestore";
