import type { SearchProvider } from "./search-provider";
import type { Video } from "./video";
import type { VideoCatalog } from "./video-catalog";

export async function discover(
  query: string,
  search: SearchProvider,
  catalog: VideoCatalog,
): Promise<Video[]> {
  const results = await search.search(query);
  const saved: Video[] = [];
  for (const result of results) {
    saved.push(await catalog.upsert(result));
  }
  return saved;
}
