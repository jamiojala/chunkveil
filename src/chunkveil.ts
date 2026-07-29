import { cleanText, extractHeadings } from "./cleaner";
import { recursiveSplit, splitParagraphs, splitSentences } from "./splitter";
import type {
  Chunk,
  ChunkMetadata,
  ChunkOptions,
  ChunkStrategy,
  DocumentInput,
  SemanticChunkOptions
} from "./types";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * ChunkVeil is a preprocessing toolkit for turning messy documents and pages
 * into high-quality chunks for RAG and AI search.
 */
export class ChunkVeil {
  private readonly defaultOptions: Required<Omit<ChunkOptions, "separator">> & {
    separator: ChunkOptions["separator"];
  };

  constructor(options: ChunkOptions = {}) {
    this.defaultOptions = {
      targetSize: options.targetSize ?? 1000,
      overlap: options.overlap ?? 200,
      minSize: options.minSize ?? 100,
      separator: options.separator ?? "auto",
      stripMarkdown: options.stripMarkdown ?? true,
      preserveHeadings: options.preserveHeadings ?? true,
      charsPerToken: options.charsPerToken ?? 4
    };
  }

  /**
   * Chunks a document using the specified strategy.
   */
  chunk(input: DocumentInput | string, options?: ChunkOptions): Chunk[] {
    const text = typeof input === "string" ? input : input.text;
    const source = typeof input === "string" ? undefined : input.source;
    const inputMeta = typeof input === "string" ? {} : input.metadata ?? {};
    const opts = { ...this.defaultOptions, ...options };

    const headings = opts.preserveHeadings ? extractHeadings(text) : [];
    const cleaned = cleanText(text, { stripMarkdown: opts.stripMarkdown });

    if (!cleaned || cleaned.length === 0) return [];
    let segments = this.splitByStrategy(cleaned, opts);
    // Always return at least one chunk
    if (segments.length === 0) segments = [cleaned];
    const chunks = this.buildChunks(segments, opts, source, headings, inputMeta);

    return this.applyOverlap(chunks, opts);
  }

  /**
   * Semantic chunking using embeddings to find natural boundaries.
   * Requires an embedding function.
   */
  async chunkSemantic(
    input: DocumentInput | string,
    options: SemanticChunkOptions
  ): Promise<Chunk[]> {
    if (!options.embedFn) {
      return this.chunk(input, options);
    }

    const text = typeof input === "string" ? input : input.text;
    const source = typeof input === "string" ? undefined : input.source;
    const opts = { ...this.defaultOptions, ...options };
    const threshold = options.similarityThreshold ?? 0.75;

    const cleaned = cleanText(text, { stripMarkdown: opts.stripMarkdown });
    const sentences = splitSentences(cleaned);

    // Embed each sentence
    const embeddings = await Promise.all(sentences.map((s) => options.embedFn!(s)));

    // Group sentences by similarity
    const groups: string[] = [];
    let currentGroup: string[] = [sentences[0] ?? ""];

    for (let i = 1; i < sentences.length; i++) {
      const prevEmbed = embeddings[i - 1]!;
      const currEmbed = embeddings[i]!;
      const sim = cosineSim(prevEmbed, currEmbed);

      if (sim < threshold) {
        groups.push(currentGroup.join(" "));
        currentGroup = [sentences[i]!];
      } else {
        currentGroup.push(sentences[i]!);
      }
    }
    if (currentGroup.length > 0) {
      groups.push(currentGroup.join(" "));
    }

    // Further split groups that exceed target size
    const segments: string[] = [];
    for (const group of groups) {
      if (group.length > opts.targetSize) {
        segments.push(...recursiveSplit(group, opts.targetSize));
      } else {
        segments.push(group);
      }
    }

 const headings = opts.preserveHeadings ? extractHeadings(text) : [];
    const chunks = this.buildChunks(segments, opts, source, headings, {});
    return this.applyOverlap(chunks, opts);
  }

  private splitByStrategy(text: string, opts: typeof this.defaultOptions): string[] {
    const strategy = this.resolveStrategy(opts.separator, text);

    switch (strategy) {
      case "paragraph":
        return this.splitWithMerge(text, () => splitParagraphs(text), opts);
      case "sentence":
        return this.splitWithMerge(text, () => splitSentences(text), opts);
      case "recursive":
        return recursiveSplit(text, opts.targetSize);
      case "fixed":
      default:
        return this.fixedSplit(text, opts);
    }
  }

  private resolveStrategy(separator: ChunkOptions["separator"], text: string): ChunkStrategy {
    if (separator === "auto") {
      if (text.includes("\n\n")) return "paragraph";
      if (text.includes(". ")) return "sentence";
      return "recursive";
    }
    if (separator === "paragraph") return "paragraph";
    if (separator === "sentence") return "sentence";
    if (separator === "word") return "recursive";
    if (separator === "character") return "fixed";
    return "recursive";
  }

  private splitWithMerge(
    text: string,
    splitFn: () => string[],
    opts: typeof this.defaultOptions
  ): string[] {
    const parts = splitFn();
    const result: string[] = [];
    let current = "";

    for (const part of parts) {
      const candidate = current ? current + "\n\n" + part : part;
      if (candidate.length <= opts.targetSize) {
        current = candidate;
      } else {
        if (current && current.length >= opts.minSize) {
          result.push(current);
        }
        if (part.length > opts.targetSize) {
          result.push(...recursiveSplit(part, opts.targetSize));
        }
        current = part;
      }
    }
    if (current) {
      // Always keep the last chunk if it's the only one, even if below minSize
      if (current.length >= opts.minSize || result.length === 0) {
        result.push(current);
      }
    }

    return result;
  }

  private fixedSplit(text: string, opts: typeof this.defaultOptions): string[] {
 const chunks: string[] = [];
    for (let i = 0; i < text.length; i += opts.targetSize - opts.overlap) {
      chunks.push(text.slice(i, i + opts.targetSize));
      if (i + opts.targetSize >= text.length) break;
    }
    return chunks.filter((c) => c.length >= opts.minSize || chunks.length === 1);
  }

  private buildChunks(
    segments: string[],
    opts: typeof this.defaultOptions,
    source: string | undefined,
    headings: { text: string; level: number; offset: number }[],
    inputMeta: Record<string, unknown>
  ): Chunk[] {
    let offset = 0;
    let currentHeading: string | undefined;
    return segments.map((text, index) => {
      const startOffset = offset;
      offset += text.length;

      for (const h of headings) {
        if (text.includes(h.text)) {
          currentHeading = h.text;
        }
      }
      const metadata: ChunkMetadata = {
        source,
        heading: currentHeading,
        tokenCount: Math.ceil(text.length / opts.charsPerToken),
        charCount: text.length,
        tags: []
      };

      // Merge in any user-provided metadata
      for (const [key, value] of Object.entries(inputMeta)) {
        if (!(key in metadata)) {
          (metadata as Record<string, unknown>)[key] = value;
        }
      }

      return {
        id: generateId(),
        text,
        index,
        startOffset,
        endOffset: startOffset + text.length,
        metadata
      };
    });
  }


  private applyOverlap(chunks: Chunk[], opts: typeof this.defaultOptions): Chunk[] {
    if (opts.overlap <= 0 || chunks.length <= 1) {
      return chunks;
    }

    const result: Chunk[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!;
      if (i > 0) {
        const prev = chunks[i - 1]!;
        const overlapText = prev.text.slice(-opts.overlap);
        if (overlapText && !chunk.text.startsWith(overlapText)) {
          const overlapped = {
            ...chunk,
            text: overlapText + chunk.text,
            startOffset: chunk.startOffset - opts.overlap,
            metadata: {
              ...chunk.metadata,
              charCount: overlapText.length + chunk.text.length,
              tokenCount: Math.ceil((overlapText.length + chunk.text.length) / opts.charsPerToken)
            }
          };
          result.push(overlapped);
          continue;
        }
      }
      result.push(chunk);
    }

    return result;
  }
}

/** Convenience factory. */
export function createChunker(options?: ChunkOptions): ChunkVeil {
  return new ChunkVeil(options);
}

function cosineSim(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export { chunk as chunkDocument };
function chunk(input: DocumentInput | string, options?: ChunkOptions): Chunk[] {
  return new ChunkVeil().chunk(input, options);
}
