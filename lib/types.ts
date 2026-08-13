export type ThreadsAccount = {
  username: string;
  displayName: string;
  bio: string;
  followerCount: number | null;
  verified: boolean;
  url: string;
};

export type SearchResponse = {
  query: string;
  count: number;
  results: ThreadsAccount[];
};
