import { useEffect, useState } from "react";
import { flipSignal, listSignals } from "./api";
import type { Signal } from "./types";

export function Signals({ onChanged }: { onChanged?: () => void }) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSignals()
      .then(setSignals)
      .catch(() => setError("Failed to load signals"));
  }, []);

  async function handleFlip(id: string) {
    try {
      await flipSignal(id);
      setSignals(await listSignals());
      onChanged?.();
    } catch {
      setError("Failed to flip signal");
    }
  }

  const superseded = new Set(
    signals.flatMap((signal) =>
      signal.supersedesId ? [signal.supersedesId] : [],
    ),
  );

  return (
    <section>
      <h2>Signal history</h2>
      {error ? <p role="alert">{error}</p> : null}
      {signals.length === 0 ? (
        <p>No signals yet.</p>
      ) : (
        <ul>
          {signals.map((signal) => (
            <li key={signal.id}>
              {signal.kind} ({signal.polarity > 0 ? "positive" : "negative"})
              {superseded.has(signal.id) ? " — superseded" : null}
              {superseded.has(signal.id) ? null : (
                <button type="button" onClick={() => handleFlip(signal.id)}>
                  Flip
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
