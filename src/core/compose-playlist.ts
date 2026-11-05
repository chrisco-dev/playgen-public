import type { NewPlaylist } from "./playlist";
import type { ScoredVideo } from "./ranking";

export interface ComposeOptions {
  name?: string;
  maxItems?: number;
  now: Date;
}

export function composePlaylist(
  scored: ScoredVideo[],
  alreadyUsed: ReadonlySet<string>,
  options: ComposeOptions,
): NewPlaylist {
  const maxItems = options.maxItems ?? 10;
  const videoIds: string[] = [];
  for (const item of scored) {
    if (videoIds.length >= maxItems) {
      break;
    }
    if (alreadyUsed.has(item.video.id)) {
      continue;
    }
    videoIds.push(item.video.id);
  }
  return {
    name: options.name ?? `Playlist ${options.now.toISOString()}`,
    videoIds,
    createdAt: options.now.toISOString(),
  };
}
