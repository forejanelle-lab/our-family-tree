import type { TreeSnapshot } from "@/lib/tree-snapshot";

export type TreeStateSlice = Pick<
  TreeSnapshot,
  "tree" | "people" | "relationships" | "photos" | "stories" | "events" | "sources" | "activity" | "userName"
>;
