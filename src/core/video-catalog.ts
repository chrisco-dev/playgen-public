import type { NewVideo, Video } from "./video";

export interface VideoCatalog {
  upsert(video: NewVideo): Promise<Video>;
  list(): Promise<Video[]>;
}
