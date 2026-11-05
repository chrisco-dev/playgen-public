import type { NewVideo } from "./video";

export interface SearchProvider {
  search(query: string): Promise<NewVideo[]>;
}
