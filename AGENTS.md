# AGENTS.md

The guide for AI coding agents is in **[CLAUDE.md](./CLAUDE.md)**. Read it first.

Short version:

- Server layers: route → controller → service → data → model. Only `src/data/` calls Mongoose.
- Soft delete everywhere (`isDeleted`, `deletedAt`). Every query is scoped to the user.
- MCP server: `POST /mcp` (stateless). Tools in `server/src/mcp/tools.js` call the same services as the REST API.
- pnpm only. Commit `pnpm-lock.yaml` when dependencies change.
- Before you finish: `pnpm test` in `server/` and `client/`, and `pnpm build` in `client/`.
