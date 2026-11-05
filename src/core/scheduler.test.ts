import { describe, expect, it, vi } from "vitest";
import { FixedClock, makeInMemoryDeps } from "../test-utils";
import type { Playlist } from "./playlist";
import type { PlaylistWriter, PublishResult } from "./playlist-writer";
import { DEFAULT_SCHEDULE } from "./schedule";
import { runScheduledPlaylist } from "./scheduled-playlist-run";

function makeWriter() {
  const publish = vi.fn(
    async (_playlist: Playlist): Promise<PublishResult> => ({
      kind: "link",
      reference: "url",
      quotaUsed: 42,
    }),
  );
  const writer: PlaylistWriter = { publish };
  return { writer, publish };
}

describe("runScheduledPlaylist", () => {
  it("runs a daily playlist and records quota", async () => {
    const clock = new FixedClock(new Date("2026-11-05T19:00:00.000Z"));
    const deps = makeInMemoryDeps(clock);
    const { writer, publish } = makeWriter();

    const run = await runScheduledPlaylist(
      { ...deps, writer },
      "daily",
      DEFAULT_SCHEDULE,
    );

    expect(run).not.toBeNull();
    expect(run?.status).toBe("done");
    expect(run?.quotaUsed).toBe(42);
    expect(publish).toHaveBeenCalledTimes(1);
  });

  it("is idempotent within the same period", async () => {
    const clock = new FixedClock(new Date("2026-11-05T19:00:00.000Z"));
    const deps = makeInMemoryDeps(clock);
    const { writer, publish } = makeWriter();

    const first = await runScheduledPlaylist(
      { ...deps, writer },
      "daily",
      DEFAULT_SCHEDULE,
    );
    const second = await runScheduledPlaylist(
      { ...deps, writer },
      "daily",
      DEFAULT_SCHEDULE,
    );

    expect(second?.id).toBe(first?.id);
    expect(publish).toHaveBeenCalledTimes(1);
  });

  it("skips before the scheduled time", async () => {
    const clock = new FixedClock(new Date("2026-11-05T10:00:00.000Z"));
    const deps = makeInMemoryDeps(clock);
    const { writer, publish } = makeWriter();

    const run = await runScheduledPlaylist(
      { ...deps, writer },
      "daily",
      DEFAULT_SCHEDULE,
    );

    expect(run).toBeNull();
    expect(publish).not.toHaveBeenCalled();
  });

  it("rejects when the writer fails", async () => {
    const clock = new FixedClock(new Date("2026-11-05T19:00:00.000Z"));
    const deps = makeInMemoryDeps(clock);
    const writer: PlaylistWriter = {
      async publish() {
        throw new Error("boom");
      },
    };

    await expect(
      runScheduledPlaylist({ ...deps, writer }, "daily", DEFAULT_SCHEDULE),
    ).rejects.toThrow("boom");
  });
});
