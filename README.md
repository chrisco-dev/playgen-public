# Playgen

A personal discovery and playlist engine that learns what one person finds
interesting, explains every recommendation, and assembles playlists on a
schedule.

## What it does

- Learns interests from explicit input and from signals — click, watch, skip,
  like, dislike, save, subscribe — each of which can be inspected and reversed.
- Discovers candidate videos and articles in the background, inside a quota
  budget that always leaves room for interactive use.
- Remembers every video it has seen, with the signals attached to it.
- Ranks candidates with a transparent, persisted score and shows why each item
  was recommended.
- Assembles daily and weekly playlists, exported as instant watch links (and,
  when OAuth is configured, pushed to YouTube).

## Design principles

1. **Explainable by construction.** Every recommendation stores its score
   contributions; the UI renders stored facts, not guesses.
2. **User-controlled.** Weights and signals can be inspected and overridden.
3. **Extensible.** Providers, scoring models, and playlist writers sit behind
   ports and can be swapped.
4. **Background-first.** Discovery runs on a schedule, not on page load.
5. **Local-first, single-user.** Multi-user is a later, deliberate change.

## Stack

TypeScript (strict) on Node 22. Fastify + Zod API, React + Vite web client,
SQLite via Drizzle. See `src/` for the layout (`core`, `contracts`,
`adapters`, `api`, `worker`, `web`).

## License

MIT — see `LICENSE`.
