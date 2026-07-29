import { describe, it, expect } from "vitest";
import { splitParagraphs, splitSentences, splitWords, recursiveSplit } from "../src/splitter";

describe("splitParagraphs", () => {
  it("splits on double newlines", () => {
    const text = "Para one.\n\nPara two.\n\nPara three.";
    expect(splitParagraphs(text)).toEqual(["Para one.", "Para two.", "Para three."]);
  });

  it("filters empty paragraphs", () => {
    expect(splitParagraphs("a\n\n\n\nb")).toEqual(["a", "b"]);
  });
});

describe("splitSentences", () => {
  it("splits on sentence boundaries", () => {
    const text = "First sentence. Second sentence! Third sentence?";
    const sentences = splitSentences(text);
    expect(sentences).toHaveLength(3);
  });

  it("preserves abbreviations", () => {
    const text = "Dr. Smith went to the store. He bought milk.";
    const sentences = splitSentences(text);
    expect(sentences).toHaveLength(2);
    expect(sentences[0]).toContain("Dr. Smith");
  });
});

describe("splitWords", () => {
  it("splits on whitespace", () => {
    expect(splitWords("hello world foo")).toEqual(["hello", "world", "foo"]);
  });
});

describe("recursiveSplit", () => {
  it("returns short text as single chunk", () => {
    expect(recursiveSplit("short", 100)).toEqual(["short"]);
  });

  it("splits long text by paragraphs first", () => {
    const text = "A".repeat(50) + "\n\n" + "B".repeat(50);
    const chunks = recursiveSplit(text, 60);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  it("respects target size", () => {
    const text = "A".repeat(200);
    const chunks = recursiveSplit(text, 50);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(50);
    }
  });
});
