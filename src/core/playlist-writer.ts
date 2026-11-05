import type { Playlist } from "./playlist";

export interface PublishResult {
  kind: "link" | "youtube";
  reference: string;
  quotaUsed: number;
}

export interface PlaylistWriter {
  publish(playlist: Playlist): Promise<PublishResult>;
}
