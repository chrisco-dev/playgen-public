import type { NewPlaylist, Playlist } from "./playlist";

export interface PlaylistStore {
  save(playlist: NewPlaylist): Promise<Playlist>;
  list(): Promise<Playlist[]>;
  usedVideoIds(): Promise<string[]>;
}
