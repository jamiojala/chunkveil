# ChunkVeil Quick Start

## Install

```bash
pnpm add @jamiojala/chunkveil
```

## Basic Chunking

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
  console.log(chunk.index, chunk.text.slice(0, 50));
  console.log("Heading:", chunk.metadata.heading);
  console.log("Tokens:", chunk.metadata.tokenCount);
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

- auto (default): picks paragraph, sentence, or recursive based on content
- paragraph: splits on double newlines
- sentence: splits on sentence boundaries
- word: recursive word-based splitting
- character: fixed-size character chunks

## Text Cleaning

```ts
import { cleanText, stripMarkdown } from "@jamiojala/chunkveil";

const cleaned = cleanText(messyText, { stripMarkdown: true });
```
