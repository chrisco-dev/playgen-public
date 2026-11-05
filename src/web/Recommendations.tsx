import { useEffect, useState } from "react";
import { listRankings, recordSignal } from "./api";
import type { ScoredVideo, SignalKind } from "./types";

export function Recommendations() {
  const [videos, setVideos] = useState<ScoredVideo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRankings()
      .then(setVideos)
      .catch(() => setError("Failed to load recommendations"));
  }, []);

  async function handleSignal(videoId: string, kind: SignalKind) {
    try {
      await recordSignal(videoId, kind);
      setVideos(await listRankings());
    } catch {
      setError("Failed to record signal");
    }
  }

  return (
    <section>
      <h2>Recommendations</h2>
      {error ? <p role="alert">{error}</p> : null}
      {videos.length === 0 ? (
        <p>No recommendations yet.</p>
      ) : (
        <ol>
          {videos.map((video) => (
            <li key={video.videoId}>
              <strong>{video.title}</strong> — score {video.score.toFixed(2)}
              <ul>
                {video.components.map((component) => (
                  <li key={component.reason}>
                    {component.reason}: {component.value.toFixed(2)}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleSignal(video.videoId, "like")}
              >
                Like
              </button>
              <button
                type="button"
                onClick={() => handleSignal(video.videoId, "dislike")}
              >
                Dislike
              </button>
              <button
                type="button"
                onClick={() => handleSignal(video.videoId, "save")}
              >
                Save
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
