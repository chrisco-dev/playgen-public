export interface NewPlaylist {
  name: string;
  videoIds: string[];
  createdAt: string;
}

export interface Playlist extends NewPlaylist {
  id: string;
}
