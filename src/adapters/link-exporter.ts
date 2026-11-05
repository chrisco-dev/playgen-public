import { watchVideosLinks } from "../core/index";
import type { Playlist, PlaylistWriter, PublishResult } from "../core/index";

export class LinkExporter implements PlaylistWriter {
  async publish(playlist: Playlist): Promise<PublishResult> {
    return {
      kind: "link",
      reference: watchVideosLinks(playlist.videoIds).join("\n"),
      quotaUsed: 0,
    };
  }
}
