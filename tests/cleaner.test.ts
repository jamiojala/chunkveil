import { describe, it, expect } from "vitest";
import { cleanText, stripMarkdown, extractHeadings } from "../src/cleaner";

describe("cleanText", () => {
  it("normalizes line endings", () => {
    expect(cleanText("a\r\nb\r\nc")).toBe("a\nb\nc");
  });

  it("removes zero-width characters", () => {
    expect(cleanText("hello\u200Bworld")).toBe("helloworld");
  });

  it("collapses multiple blank lines", () => {
    expect(cleanText("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("trims trailing whitespace per line", () => {
    expect(cleanText("a   \nb   ")).toBe("a\nb");
  });

  it("strips markdown when option is set", () => {
    const result = cleanText("# Heading\n**bold** text", { stripMarkdown: true });
    expect(result).toContain("Heading");
    expect(result).toContain("bold text");
    expect(result).not.toContain("#");
    expect(result).not.toContain("**");
  });
});

describe("stripMarkdown", () => {
  it("removes headers", () => {
    expect(stripMarkdown("# Title")).toBe("Title");
    expect(stripMarkdown("### Subtitle")).toBe("Subtitle");
  });

  it("removes bold and italic", () => {
    expect(stripMarkdown("**bold**")).toBe("bold");
    expect(stripMarkdown("*italic*")).toBe("italic");
  });

  it("removes links but keeps text", () => {
    expect(stripMarkdown("[click here](https://example.com)")).toBe("click here");
  });

  it("removes images", () => {
    expect(stripMarkdown("![alt](image.png)")).toBe("");
  });

  it("removes list markers", () => {
    expect(stripMarkdown("- item 1\n- item 2")).toBe("item 1\nitem 2");
    expect(stripMarkdown("1. first\n2. second")).toBe("first\nsecond");
  });

  it("removes blockquotes", () => {
    expect(stripMarkdown("> quoted text")).toBe("quoted text");
  });

  it("removes inline code", () => {
    expect(stripMarkdown("use `console.log`")).toBe("use console.log");
  });
});

describe("extractHeadings", () => {
  it("extracts headings with levels", () => {
    const text = "# Title\nSome content\n## Section\nMore content";
    const headings = extractHeadings(text);
    expect(headings).toHaveLength(2);
    expect(headings[0]?.text).toBe("Title");
    expect(headings[0]?.level).toBe(1);
    expect(headings[1]?.text).toBe("Section");
    expect(headings[1]?.level).toBe(2);
  });

  it("returns empty for no headings", () => {
    expect(extractHeadings("Plain text")).toHaveLength(0);
  });
});
