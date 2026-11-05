export interface Video {
  id: string;
  provider: string;
  externalId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  durationSeconds: number;
  publishedAt: string;
  tags: string[];
  firstSeenAt: string;
}

export interface NewVideo {
  provider: string;
  externalId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  durationSeconds: number;
  publishedAt: string;
  tags: string[];
}
