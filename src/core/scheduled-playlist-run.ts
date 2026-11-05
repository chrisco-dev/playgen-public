import type { Clock } from "./clock";
import { composePlaylist } from "./compose-playlist";
import type { InterestRepository } from "./interest-repository";
import type { PlaylistStore } from "./playlist-store";
import type { PlaylistWriter } from "./playlist-writer";
import type { ScoringModel } from "./ranking";
import type { RunRecord, RunStore } from "./run-store";
import type { ScheduleConfig, ScheduleKind } from "./schedule";
import { isDue } from "./schedule";
import type { SignalRepository } from "./signal-repository";
import { DEFAULT_USER_ID } from "./user";
import type { VideoCatalog } from "./video-catalog";

export interface ScheduledRunDeps {
  clock: Clock;
  runStore: RunStore;
  interestRepository: InterestRepository;
  videoCatalog: VideoCatalog;
  scoringModel: ScoringModel;
  signalRepository: SignalRepository;
  playlistStore: PlaylistStore;
  writer: PlaylistWriter;
}

export async function runScheduledPlaylist(
  deps: ScheduledRunDeps,
  kind: ScheduleKind,
  config: ScheduleConfig,
): Promise<RunRecord | null> {
  const now = deps.clock.now();
  const latest = await deps.runStore.findLatestCompleted(kind);
  const lastCompletedAt = latest?.finishedAt
    ? new Date(latest.finishedAt)
    : null;
  if (!isDue(kind, now, lastCompletedAt, config)) {
    return latest;
  }

  const run = await deps.runStore.create({
    kind,
    startedAt: now.toISOString(),
  });
  try {
    const interests = await deps.interestRepository.list(DEFAULT_USER_ID);
    const videos = await deps.videoCatalog.list();
    const liveSignals = await deps.signalRepository.listLive();
    const ranked = await deps.scoringModel.rank(
      videos,
      interests,
      now,
      liveSignals,
    );
    const used = new Set(await deps.playlistStore.usedVideoIds());
    const playlist = composePlaylist(ranked, used, {
      name: `${kind} playlist`,
      now,
    });
    const saved = await deps.playlistStore.save(playlist);
    const result = await deps.writer.publish(saved);
    return await deps.runStore.finish(
      run.id,
      "done",
      result.quotaUsed,
      now.toISOString(),
    );
  } catch (error) {
    await deps.runStore.finish(run.id, "failed", 0, now.toISOString());
    throw error;
  }
}
