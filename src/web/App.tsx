import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Recommendations } from "./Recommendations";
import { Signals } from "./Signals";
import {
  createInterest,
  deleteInterest,
  listInterests,
  updateInterest,
} from "./api";
import type { Interest } from "./types";

export function App() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [label, setLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    listInterests()
      .then(setInterests)
      .catch(() => setError("Failed to load interests"));
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!label.trim()) {
      return;
    }
    try {
      const created = await createInterest(label.trim());
      setInterests((prev) => [...prev, created]);
      setLabel("");
    } catch {
      setError("Failed to add interest");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteInterest(id);
      setInterests((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError("Failed to delete interest");
    }
  }

  async function handleSaveEdit(id: string) {
    try {
      const updated = await updateInterest(id, { label: editingLabel.trim() });
      setInterests((prev) =>
        prev.map((item) => (item.id === id ? updated : item)),
      );
      setEditingId(null);
    } catch {
      setError("Failed to update interest");
    }
  }

  return (
    <main>
      <h1>Playgen</h1>
      <form onSubmit={handleAdd}>
        <label htmlFor="interest">Interest</label>
        <input
          id="interest"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      {interests.length === 0 ? (
        <p>No interests yet.</p>
      ) : (
        <ul>
          {interests.map((interest) => (
            <li key={interest.id}>
              {editingId === interest.id ? (
                <>
                  <input
                    value={editingLabel}
                    onChange={(event) => setEditingLabel(event.target.value)}
                    aria-label="Rename interest"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(interest.id)}
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <span>
                    {interest.label} (weight {interest.weight})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(interest.id);
                      setEditingLabel(interest.label);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(interest.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <Recommendations key={refreshKey} />
      <Signals onChanged={() => setRefreshKey((key) => key + 1)} />
    </main>
  );
}
