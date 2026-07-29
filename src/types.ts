export interface Chunk {
  id: string;
  text: string;
  index: number;
  startOffset: number;
  endOffset: number;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  source?: string | undefined;
  section?: string | undefined;
  page?: number | undefined;
  heading?: string | undefined;
  language?: string | undefined;
  tokenCount?: number | undefined;
  charCount?: number | undefined;
  tags?: string[] | undefined;
}

export interface ChunkOptions {
  /** Target chunk size in characters. Default 1000. */
  targetSize?: number;
  /** Overlap between chunks in characters. Default 200. */
  overlap?: number;
  /** Minimum chunk size. Smaller chunks are merged. Default 100. */
  minSize?: number;
 /** Separator strategy. Default "auto". */
  separator?: "auto" | "paragraph" | "sentence" | "word" | "character";
  /** Whether to strip markdown formatting. Default true. */
  stripMarkdown?: boolean;
  /** Whether to preserve heading context. Default true. */
  preserveHeadings?: boolean;
  /** Approximate tokens per character for token count estimation. Default 4. */
  charsPerToken?: number;
}

export type ChunkStrategy = "fixed" | "sentence" | "paragraph" | "semantic" | "recursive";

export interface SemanticChunkOptions extends ChunkOptions {
  /** Embedding function for semantic chunking. */
  embedFn?: (text: string) => Promise<number[]>;
  /** Similarity threshold for boundary detection. Default 0.75. */
  similarityThreshold?: number;
}

export interface DocumentInput {
  text: string;
  source?: string;
  metadata?: Record<string, unknown>;
}
