import type { FastifyInstance } from "fastify";
import { createSignalSchema, signalSchema } from "../contracts/index";
import { defaultPolarity, flipSignal } from "../core/index";
import type { Clock, SignalRepository } from "../core/index";

export interface SignalDeps {
  clock: Clock;
  signalRepository: SignalRepository;
}

export function registerSignalRoutes(app: FastifyInstance, deps: SignalDeps) {
  app.get("/signals", async () => {
    const signals = await deps.signalRepository.list();
    return signals.map((signal) => signalSchema.parse(signal));
  });

  app.post("/signals", async (request, reply) => {
    const parsed = createSignalSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: "Invalid request", issues: parsed.error.issues };
    }
    const input = parsed.data;
    const recorded = await deps.signalRepository.record({
      videoId: input.videoId,
      kind: input.kind,
      polarity: defaultPolarity(input.kind),
      delta: input.delta,
      createdAt: deps.clock.now().toISOString(),
      supersedesId: null,
    });
    reply.code(201);
    return signalSchema.parse(recorded);
  });

  app.post("/signals/:id/flip", async (request, reply) => {
    const { id } = request.params as { id: string };
    const original = await deps.signalRepository.get(id);
    if (!original) {
      reply.code(404);
      return { error: "Not found" };
    }
    const live = await deps.signalRepository.listLive();
    if (!live.some((signal) => signal.id === id)) {
      reply.code(409);
      return { error: "Signal already superseded" };
    }
    const flipped = flipSignal(original, deps.clock.now());
    const recorded = await deps.signalRepository.record(flipped);
    reply.code(201);
    return signalSchema.parse(recorded);
  });
}
