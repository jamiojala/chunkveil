# Contributing to ChunkVeil

Thanks for contributing to ChunkVeil.

## Prerequisites

- Node.js 18.18+
- pnpm 10+

## Setup

```bash
pnpm install
```

## Development Commands

```bash
pnpm test
pnpm test:watch
pnpm typecheck
pnpm build
pnpm example:basic
pnpm example:semantic
```

## Project Standards

 Keep APIs strongly typed and backward-compatible when possible.
 Add tests for all behavior changes.
 Keep docs and examples in sync with code changes.

## Changesets

ChunkVeil uses Changesets for releases. Run pnpm changeset, select the package, choose a version bump, and describe the change.
