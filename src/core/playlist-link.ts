const DEFAULT_MAX_PER_LINK = 50;

export function watchVideosLinks(
  videoIds: string[],
  maxPerLink = DEFAULT_MAX_PER_LINK,
): string[] {
  const links: string[] = [];
  for (let i = 0; i < videoIds.length; i += maxPerLink) {
    links.push(
      `https://www.youtube.com/watch_videos?video_ids=${videoIds
        .slice(i, i + maxPerLink)
        .join(",")}`,
    );
  }
  return links;
}
