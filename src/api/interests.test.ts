import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeInMemoryDeps } from "../test-utils";
import { buildServer } from "./server";

describe("interest routes", () => {
  let app: Awaited<ReturnType<typeof buildServer>>;

  beforeEach(async () => {
    app = await buildServer(makeInMemoryDeps());
  });

  afterEach(async () => {
    await app.close();
  });

  it("creates an interest with defaults and lists it", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/interests",
      payload: { label: "TypeScript" },
    });
    expect(create.statusCode).toBe(201);
    expect(create.json()).toMatchObject({
      label: "TypeScript",
      weight: 1,
      confidence: 1,
      source: "manual",
    });

    const list = await app.inject({ method: "GET", url: "/interests" });
    expect(list.statusCode).toBe(200);
    expect(list.json()).toHaveLength(1);
  });

  it("rejects an invalid interest", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/interests",
      payload: { label: "" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("updates and deletes an interest", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/interests",
      payload: { label: "AI" },
    });
    const created = create.json();

    const update = await app.inject({
      method: "PATCH",
      url: `/interests/${created.id}`,
      payload: { weight: 5 },
    });
    expect(update.statusCode).toBe(200);
    expect(update.json()).toMatchObject({ weight: 5, label: "AI" });

    const del = await app.inject({
      method: "DELETE",
      url: `/interests/${created.id}`,
    });
    expect(del.statusCode).toBe(204);

    const gone = await app.inject({
      method: "GET",
      url: `/interests/${created.id}`,
    });
    expect(gone.statusCode).toBe(404);
  });

  it("returns 404 for an unknown id on get, patch, and delete", async () => {
    const get = await app.inject({ method: "GET", url: "/interests/nope" });
    expect(get.statusCode).toBe(404);

    const patch = await app.inject({
      method: "PATCH",
      url: "/interests/nope",
      payload: { label: "x" },
    });
    expect(patch.statusCode).toBe(404);

    const del = await app.inject({ method: "DELETE", url: "/interests/nope" });
    expect(del.statusCode).toBe(404);
  });

  it("rejects an out-of-range patch", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/interests",
      payload: { label: "AI" },
    });
    const created = create.json();

    const res = await app.inject({
      method: "PATCH",
      url: `/interests/${created.id}`,
      payload: { weight: 99 },
    });
    expect(res.statusCode).toBe(400);
  });
});
