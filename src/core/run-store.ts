import type { ScheduleKind } from "./schedule";

export type RunStatus = "running" | "done" | "failed";

export interface RunRecord {
  id: string;
  kind: ScheduleKind;
  status: RunStatus;
  startedAt: string;
  finishedAt: string | null;
  quotaUsed: number;
}

export interface RunStore {
  findLatestCompleted(kind: ScheduleKind): Promise<RunRecord | null>;
  create(input: { kind: ScheduleKind; startedAt: string }): Promise<RunRecord>;
  finish(
    id: string,
    status: RunStatus,
    quotaUsed: number,
    finishedAt: string,
  ): Promise<RunRecord>;
}
