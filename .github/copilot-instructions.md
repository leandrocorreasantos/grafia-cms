# Grafia CMS - Copilot Instructions

Grafia CMS is a TypeScript/JavaScript monorepo with a DDD-oriented API, a Next.js web app, Prisma persistence, and a production CLI/server distribution layer.

## Architecture

- Treat `apps/api/src/domain/` as the business core.
- Keep `apps/api/src/application/` focused on orchestration and DTOs.
- Keep `apps/api/src/infrastructure/` limited to concrete integrations such as Prisma.
- Keep `apps/api/src/interfaces/` thin: HTTP adapters, routes, middleware, and request/response mapping.
- Keep `scripts/` and `server.js` free of direct database access unless a script explicitly owns provisioning or setup.

## Code rules

- Prefer explicit types and immutable data where practical.
- Keep functions small and names descriptive.
- Avoid leaking Prisma models, Express objects, or transport concerns into domain or application code.
- Use domain errors for business rule failures and map them to HTTP at the boundary.
- Preserve the project vocabulary: `Post`, `User`, `slug`, `excerpt`, `publish()`, `archive()`.

## Validation and testing

- Prefer tests that verify behavior, not implementation details.
- Use in-memory fakes for unit tests when the repository interface is enough.
- Keep integration tests focused on the API surface and repository behavior.
- After edits, run the narrowest relevant test or typecheck for the touched slice.

## Security

- Assume user input is untrusted until validated.
- Watch for SQL injection, XSS, command injection, SSRF, IDOR/BOLA, weak auth, leaked secrets, weak crypto, and unsafe logging.
- Keep credentials, tokens, and private keys out of source files and responses.
- Prefer parameterized ORM/database access and explicit allowlists for dynamic values.

## Tone and output

- Be direct about architectural violations or security risks.
- When proposing changes, explain the root cause and the smallest safe fix.
- If a requested change conflicts with the architecture, call that out and suggest the boundary where it belongs.