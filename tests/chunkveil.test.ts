import { describe, it, expect } from "vitest";
import { createChunker } from "../src/chunkveil";

describe("ChunkVeil", () => {
  it("chunks a simple document", () => {
    const chunker = createChunker({ targetSize: 100, overlap: 0 });
    const text = "A".repeat(250);
    const chunks = chunker.chunk(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.text.length <= 100 || chunks.length === 1)).toBe(true);
  });

  it("assigns sequential indices", () => {
    const chunker = createChunker({ targetSize: 50, overlap: 0 });
    const chunks = chunker.chunk("A".repeat(200));
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i]!.index).toBe(i);
    }
  });

  it("assigns unique IDs", () => {
    const chunker = createChunker({ targetSize: 50, overlap: 0 });
    const chunks = chunker.chunk("A".repeat(200));
    const ids = new Set(chunks.map((c) => c.id));
    expect(ids.size).toBe(chunks.length);
  });

  it("preserves source metadata", () => {
    const chunker = createChunker({ targetSize: 100, overlap: 0 });
    const chunks = chunker.chunk({ text: "A".repeat(200), source: "doc.md" });
    expect(chunks.every((c) => c.metadata.source === "doc.md")).toBe(true);
  });

  it("tracks offsets", () => {
    const chunker = createChunker({ targetSize: 100, overlap: 0 });
    const chunks = chunker.chunk("A".repeat(250));
    expect(chunks[0]!.startOffset).toBe(0);
    expect(chunks[chunks.length - 1]!.endOffset).toBeGreaterThan(0);
  });

  it("estimates token count", () => {
    const chunker = createChunker({ targetSize: 1000, overlap: 0, charsPerToken: 4 });
    const chunks = chunker.chunk("Hello world this is a test.");
    expect(chunks[0]?.metadata.tokenCount).toBeGreaterThan(0);
  });

  it("strips markdown by default", () => {
    const chunker = createChunker({ targetSize: 1000, overlap: 0, minSize: 1 });
    const chunks = chunker.chunk("# Heading\n\n**Bold** text");
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]?.text).not.toContain("#");
    expect(chunks[0]?.text).not.toContain("**");
  });

  it("preserves heading context", () => {
    const chunker = createChunker({ targetSize: 1000, overlap: 0, minSize: 1 });
    const text = "# My Heading\n\nSome content here that is long enough.";
    const chunks = chunker.chunk(text);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]?.metadata.heading).toBe("My Heading");
  });

  it("splits by paragraphs when available", () => {
    const chunker = createChunker({ targetSize: 30, overlap: 0, minSize: 10 });
    const text = "Short paragraph one.\n\nShort paragraph two.\n\nShort paragraph three.";
    const chunks = chunker.chunk(text);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  it("merges small chunks", () => {
    const chunker = createChunker({ targetSize: 200, overlap: 0, minSize: 50 });
    const text = "tiny.\n\ntiny.\n\ntiny.\n\nenough text here to make a decent chunk that exceeds minimum size.";
    const chunks = chunker.chunk(text);
    // Very small segments should be merged
    expect(chunks.length).toBeLessThan(4);
  });

  it("applies overlap between chunks", () => {
    const chunker = createChunker({ targetSize: 50, overlap: 10 });
    const text = "A".repeat(200);
    const chunks = chunker.chunk(text);
    if (chunks.length > 1) {
      // The second chunk should start with some text from the end of the first
      const overlap = chunks[0]!.text.slice(-10);
      expect(chunks[1]!.text.startsWith(overlap)).toBe(true);
    }
  });

  it("accepts string input", () => {
    const chunker = createChunker();
    const chunks = chunker.chunk("Simple text document for testing.");
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });

  it("preserves user metadata", () => {
    const chunker = createChunker({ targetSize: 1000, overlap: 0 });
    const chunks = chunker.chunk({
      text: "Test content",
      metadata: { custom: "value", page: 5 }
    });
    expect(chunks[0]?.metadata["page"]).toBe(5);
  });

  it("handles empty text gracefully", () => {
    const chunker = createChunker();
    const chunks = chunker.chunk("");
    expect(chunks).toEqual([]);
  });

  it("chunkSemantic falls back without embedFn", async () => {
    const chunker = createChunker({ targetSize: 100, overlap: 0 });
    const chunks = await chunker.chunkSemantic("A".repeat(200), {});
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("chunkSemantic uses embeddings when provided", async () => {
    const chunker = createChunker({ targetSize: 100, overlap: 0 });
    const embedFn = async (text: string): Promise<number[]> => {
      // Simple bag-of-words embedding
      const words = text.toLowerCase().split(/\s+/);
      return [words.includes("topic") ? 1 : 0, words.includes("weather") ? 1 : 0];
    };

    const text = "This is about topic one. This is also about topic. Now switching to weather. Weather is nice today.";
    const chunks = await chunker.chunkSemantic(text, {
      embedFn,
      similarityThreshold: 0.5
    });

    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });
});
