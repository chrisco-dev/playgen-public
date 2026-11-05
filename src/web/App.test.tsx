// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import * as api from "./api";
import type { Interest, ScoredVideo, Signal } from "./types";

vi.mock("./api");

const sampleInterest: Interest = {
  id: "1",
  userId: "u",
  label: "Rust",
  weight: 5,
  confidence: 1,
  source: "manual",
  createdAt: "x",
  updatedAt: "x",
};

const sampleRanking: ScoredVideo = {
  videoId: "v1",
  title: "Rust for beginners",
  channelTitle: "ch",
  provider: "fixture",
  externalId: "rust-1",
  score: 6,
  components: [
    { reason: 'matches interest "Rust"', value: 5 },
    { reason: "recency", value: 1 },
  ],
  modelVersion: "weighted-tags-v0",
};

const sampleSignal: Signal = {
  id: "s1",
  videoId: "v1",
  kind: "like",
  polarity: 1,
  delta: 1,
  createdAt: "x",
  supersedesId: null,
};

describe("App", () => {
  beforeEach(() => {
    vi.mocked(api.listInterests).mockResolvedValue([]);
    vi.mocked(api.listRankings).mockResolvedValue([]);
    vi.mocked(api.listSignals).mockResolvedValue([]);
  });

  afterEach(cleanup);

  it("renders interests returned by the API", async () => {
    vi.mocked(api.listInterests).mockResolvedValue([sampleInterest]);
    render(<App />);
    expect(await screen.findByText("Rust (weight 5)")).toBeTruthy();
  });

  it("shows an empty state when there are no interests", async () => {
    render(<App />);
    expect(await screen.findByText(/no interests/i)).toBeTruthy();
  });

  it("adds an interest", async () => {
    vi.mocked(api.createInterest).mockResolvedValue(sampleInterest);
    render(<App />);
    fireEvent.change(screen.getByLabelText("Interest"), {
      target: { value: "Go" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(api.createInterest).toHaveBeenCalledWith("Go");
  });

  it("renders a recommendation with its contributions", async () => {
    vi.mocked(api.listRankings).mockResolvedValue([sampleRanking]);
    render(<App />);
    expect(await screen.findByText("Rust for beginners")).toBeTruthy();
    expect(screen.getByText(/matches interest "Rust"/)).toBeTruthy();
    expect(screen.getByText(/recency/)).toBeTruthy();
  });

  it("records a signal from a recommendation", async () => {
    vi.mocked(api.listRankings).mockResolvedValue([sampleRanking]);
    vi.mocked(api.recordSignal).mockResolvedValue(sampleSignal);
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Like" }));
    expect(api.recordSignal).toHaveBeenCalledWith("v1", "like");
  });

  it("flips a signal from the history", async () => {
    vi.mocked(api.listSignals).mockResolvedValue([sampleSignal]);
    vi.mocked(api.flipSignal).mockResolvedValue({
      ...sampleSignal,
      polarity: -1,
    });
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Flip" }));
    expect(api.flipSignal).toHaveBeenCalledWith("s1");
  });
});
