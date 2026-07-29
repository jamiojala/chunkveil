import { createChunker } from "../src/index";

async function main() {
  const chunker = createChunker({ targetSize: 300, overlap: 0 });

  // Mock embedding function
  const embedFn = async (text: string): Promise<number[]> => {
    const vocab = ["ai", "weather", "coffee", "code", "sports", "music", "food"];
    return vocab.map((word) => (text.toLowerCase().includes(word) ? 1 : 0));
  };

  const text = `AI is transforming how we work. Machine learning models are everywhere.

The weather today is sunny and warm. A perfect day for a walk.

I love coffee in the morning. It helps me focus on writing code.

Writing clean code is an art. Good code is readable and maintainable.`;

  const chunks = await chunker.chunkSemantic(text, {
    embedFn,
    similarityThreshold: 0.5
  });

  console.log(`Semantic chunking produced ${chunks.length} chunks:\n`);
  for (const chunk of chunks) {
    console.log(`[Chunk ${chunk.index}] (${chunk.metadata.tokenCount} tokens)`);
    console.log(`  ${chunk.text.slice(0, 100)}...`);
    console.log();
  }
}

main().catch(console.error);
