# ChunkVeil

[![CI](https://img.shields.io/github/actions/workflow/status/jamiojala/chunkveil/ci.yml?branch=main&label=CI)](https://github.com/jamiojala/chunkveil/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40jamiojala%2Fchunkveil)](https://www.npmjs.com/package/@jamiojala/chunkveil)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](./LICENSE)

`@jamiojala/chunkveil` is a preprocessing toolkit for turning messy documents and pages into high-quality chunks for RAG and AI search.

It cleans text, strips markdown, preserves heading context, splits by paragraphs or sentences, applies overlap, and optionally uses embeddings for semantic boundary detection. All local, zero dependencies.

## Why ChunkVeil

Chunk quality directly determines RAG quality. Bad chunks mean bad retrieval, no matter how good your embeddings are. ChunkVeil gives you clean, well-structured chunks with heading context, token estimates, and overlap out of the box.

- Automatic strategy selection (paragraph, sentence, recursive)
- Markdown stripping while preserving heading context
- Configurable target size, overlap, and minimum chunk size
- Semantic chunking with pluggable embedding functions
- Token count estimation
- Source and metadata tracking per chunk
- Text cleaning utilities (whitespace normalization, zero-width removal)
- Zero runtime dependencies

## Install

```bash
pnpm add @jamiojala/chunkveil
```

## Quick Start

```ts
import { createChunker } from "@jamiojala/chunkveil";

const chunker = createChunker({
  targetSize: 1000,
  overlap: 200,
  stripMarkdown: true
});

const chunks = chunker.chunk({
  text: "# My Document\n\nLong content here...",
  source: "doc.md"
});

for (const chunk of chunks) {
  console.log(chunk.index, chunk.metadata.heading);
  console.log(`  ~${chunk.metadata.tokenCount} tokens`);
  console.log(`  ${chunk.text.slice(0, 80)}...`);
}
```

## Semantic Chunking

```ts
const chunker = createChunker({ targetSize: 500 });

const chunks = await chunker.chunkSemantic(text, {
  embedFn: async (text) => generateEmbedding(text),
  similarityThreshold: 0.75
});
```

## Strategies

- `auto` (default): picks paragraph, sentence, or recursive based on content
- `paragraph`: splits on double newlines
- `sentence`: splits on sentence boundaries (preserves abbreviations)
- `word`: recursive word-based splitting
- `character`: fixed-size character chunks

## Text Cleaning

```ts
import { cleanText, stripMarkdown, extractHeadings } from "@jamiojala/chunkveil";

const cleaned = cleanText(messyText, { stripMarkdown: true });
const headings = extractHeadings(markdownText);
```

## API

See [docs/api.md](./docs/api.md) for the full reference.

## Documentation

- [Quick Start](./docs/quickstart.md)
- [API Reference](./docs/api.md)

## Development

```bash
pnpm install
pnpm check
```

## Examples

- [Basic chunking](./examples/basic.ts)
- [Semantic chunking](./examples/semantic.ts)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
