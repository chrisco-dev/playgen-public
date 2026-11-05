import type { FastifyInstance } from "fastify";
import {
  createInterestSchema,
  interestSchema,
  updateInterestSchema,
} from "../contracts/index";
import { DEFAULT_USER_ID } from "../core/index";
import type { InterestRepository } from "../core/index";

export function registerInterestRoutes(
  app: FastifyInstance,
  repo: InterestRepository,
) {
  app.get("/interests", async () => {
    const items = await repo.list(DEFAULT_USER_ID);
    return items.map((item) => interestSchema.parse(item));
  });

  app.post("/interests", async (request, reply) => {
    const parsed = createInterestSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: "Invalid request", issues: parsed.error.issues };
    }
    const created = await repo.create({
      userId: DEFAULT_USER_ID,
      ...parsed.data,
    });
    reply.code(201);
    return interestSchema.parse(created);
  });

  app.get("/interests/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await repo.get(id);
    if (!item) {
      reply.code(404);
      return { error: "Not found" };
    }
    return interestSchema.parse(item);
  });

  app.patch("/interests/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateInterestSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: "Invalid request", issues: parsed.error.issues };
    }
    const updated = await repo.update(id, parsed.data);
    if (!updated) {
      reply.code(404);
      return { error: "Not found" };
    }
    return interestSchema.parse(updated);
  });

  app.delete("/interests/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const removed = await repo.remove(id);
    if (!removed) {
      reply.code(404);
      return { error: "Not found" };
    }
    reply.code(204).send();
  });
}
