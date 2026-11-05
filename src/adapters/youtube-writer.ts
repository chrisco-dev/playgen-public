import type { Playlist, PlaylistWriter, PublishResult } from "../core/index";

// OAuth playlist insertion is M2. This adapter defines the port contract and
// fails fast until real YouTube OAuth credentials are configured.
export class YouTubeApiWriter implements PlaylistWriter {
  constructor(private readonly accessToken: string | null = null) {}

  async publish(playlist: Playlist): Promise<PublishResult> {
    if (!this.accessToken) {
      throw new Error("YouTube OAuth not configured");
    }
    throw new Error("YouTube API playlist insertion not implemented (M2)");
  }
}
