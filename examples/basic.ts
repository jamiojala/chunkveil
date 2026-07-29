import { createChunker } from "../src/index";

async function main() {
  const chunker = createChunker({
    targetSize: 200,
    overlap: 50,
    stripMarkdown: true
  });

  const document = `# AI Observability

Observability for AI applications means tracking tokens, cost, latency, and errors across all model calls.

## Why It Matters

Without observability, you can't know what your AI app actually costs. You also can't identify which calls are slow or failing.

## Key Metrics

Token usage tells you how much content is being processed. Cost attribution ties tokens to dollars. Latency shows where time is spent. Error rates reveal reliability issues.

## Implementation

Use a tracing-based approach. Each model call becomes a span. Spans aggregate into traces. Traces give you the full picture.`;

  const chunks = chunker.chunk({ text: document, source: "guide.md" });

  console.log(`Generated ${chunks.length} chunks:\n`);
  for (const chunk of chunks) {
    console.log(`[Chunk ${chunk.index}] ${chunk.metadata.heading ?? "no heading"}`);
    console.log(`  Offset: ${chunk.startOffset}-${chunk.endOffset}`);
    console.log(`  Tokens: ~${chunk.metadata.tokenCount}`);
    console.log(`  Text: ${chunk.text.slice(0, 80)}...`);
    console.log();
  }
}

main().catch(console.error);
