/**
 * Splits text into sentences, paragraphs, or words.
 * Used as building blocks for chunking strategies.
 */

/** Splits text into paragraphs (double newline separated). */
export function splitParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

/** Splits text into sentences. */
export function splitSentences(text: string): string[] {
  // Handles common abbreviations to avoid false splits
  const abbreviations = /\b(Mr|Mrs|Dr|Prof|Sr|Jr|vs|etc|e\.g|i\.e|Inc|Ltd|Co)\./gi;
  const placeholder = "___ABBR___";

  let protected_text = text.replace(abbreviations, (m) =>
    m.replace(".", placeholder)
  );

  // Split on sentence-ending punctuation followed by space and capital letter
  const sentences = protected_text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences.map((s) => s.replace(new RegExp(placeholder, "g"), "."));
}

/** Splits text into words. */
export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** Splits text by a separator, returning non-empty parts. */
export function splitBy(text: string, separator: string | RegExp): string[] {
  return text.split(separator).map((s) => s.trim()).filter(Boolean);
}

/**
 * Recursively splits text by the best available separator,
 * from coarsest to finest, until chunks fit the target size.
 */
export function recursiveSplit(
  text: string,
  targetSize: number,
  separators: string[] = ["\n\n", "\n", ". ", " ", ""]
): string[] {
  if (text.length <= targetSize) {
    return [text];
  }

  for (let i = 0; i < separators.length; i++) {
    const sep = separators[i]!;
    if (sep === "") {
      // Last resort: character split
      return chunkBySize(text, targetSize);
    }

    if (text.includes(sep)) {
      const parts = text.split(sep);
      const result: string[] = [];
      let current = "";

      for (const part of parts) {
        const candidate = current ? current + sep + part : part;
        if (candidate.length <= targetSize) {
          current = candidate;
        } else {
          if (current) result.push(current);
          if (part.length > targetSize) {
            result.push(...recursiveSplit(part, targetSize, separators.slice(i + 1)));
          } else {
            current = part;
          }
        }
      }
      if (current) result.push(current);

      return result;
    }
  }

  return [text];
}

function chunkBySize(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}
