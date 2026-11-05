import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeInMemoryDeps } from "../test-utils";
import { buildServer } from "./server";

describe("signal routes", () => {
  let deps: ReturnType<typeof makeInMemoryDeps>;
  let app: Awaited<ReturnType<typeof buildServer>>;

  beforeEach(async () => {
    deps = makeInMemoryDeps();
    app = await buildServer(deps);
  });

  afterEach(async () => {
    await app.close();
  });

  it("records a signal with the default polarity", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/signals",
      payload: { videoId: "v1", kind: "like" },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      videoId: "v1",
      kind: "like",
      polarity: 1,
    });
  });

  it("records a negative polarity for dislike", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/signals",
      payload: { videoId: "v1", kind: "dislike" },
    });

    expect(res.json().polarity).toBe(-1);
  });

  it("flips a signal and keeps the audit trail", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/signals",
      payload: { videoId: "v1", kind: "click" },
    });
    const id = created.json().id;

    const flipped = await app.inject({
      method: "POST",
      url: `/signals/${id}/flip`,
    });
    expect(flipped.statusCode).toBe(201);
    expect(flipped.json()).toMatchObject({ polarity: -1, supersedesId: id });

    const list = await app.inject({ method: "GET", url: "/signals" });
    expect(list.json()).toHaveLength(2);
  });

  it("rejects flipping an already-superseded signal", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/signals",
      payload: { videoId: "v1", kind: "click" },
    });
    const id = created.json().id;
    await app.inject({ method: "POST", url: `/signals/${id}/flip` });

    const again = await app.inject({
      method: "POST",
      url: `/signals/${id}/flip`,
    });

    expect(again.statusCode).toBe(409);
  });
});
