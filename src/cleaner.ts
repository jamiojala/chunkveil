/**
 * Cleans and normalizes text before chunking.
 * Removes excessive whitespace, fixes line endings, strips markdown.
 */
export function cleanText(text: string, options: {
  stripMarkdown?: boolean;
  normalizeWhitespace?: boolean;
} = {}): string {
  let result = text;

  // Normalize line endings
  result = result.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Remove zero-width characters
  result = result.replace(/[\u200B\u200C\u200D\uFEFF]/g, "");

  if (options.stripMarkdown) {
    result = stripMarkdown(result);
  }

  if (options.normalizeWhitespace !== false) {
    // Collapse multiple blank lines
    result = result.replace(/\n{3,}/g, "\n\n");
    // Trim trailing whitespace on each line
    result = result.split("\n").map((l) => l.trimEnd()).join("\n");
    // Remove leading/trailing whitespace
    result = result.trim();
  }

  return result;
}

/**
 * Strips common markdown formatting while preserving text content.
 */
export function stripMarkdown(text: string): string {
  let result = text;

  // Remove code blocks
  result = result.replace(/```[\s\S]*?```/g, (m) =>
    m.replace(/```\w*\n?/g, "").replace(/```$/g, "")
  );

  // Remove inline code
  result = result.replace(/`([^`]+)`/g, "$1");

  // Remove headers (keep text)
  result = result.replace(/^#{1,6}\s+/gm, "");

  // Remove bold/italic markers
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, "$1");
  result = result.replace(/\*\*(.+?)\*\*/g, "$1");
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1");
  result = result.replace(/__(.+?)__/g, "$1");
  result = result.replace(/_(.+?)_/g, "$1");

  // Remove images (before links, since images start with !)
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

  // Remove links (keep text)
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove blockquotes
  result = result.replace(/^>\s+/gm, "");

  // Remove list markers
  result = result.replace(/^[\s]*[-*+]\s+/gm, "");
  result = result.replace(/^[\s]*\d+\.\s+/gm, "");

  // Remove horizontal rules
  result = result.replace(/^---+$/gm, "");
  result = result.replace(/^\*\*\*+$/gm, "");

  return result;
}

/**
 * Extracts headings from markdown text.
 * Returns an array of heading text and their positions.
 */
export function extractHeadings(text: string): { text: string; level: number; offset: number }[] {
  const headings: { text: string; level: number; offset: number }[] = [];
  const lines = text.split("\n");
  let offset = 0;

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        text: match[2] ?? "",
        level: match[1]!.length,
        offset
      });
    }
    offset += line.length + 1; // +1 for the newline
  }

  return headings;
}
