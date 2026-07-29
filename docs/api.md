# ChunkVeil API

## createChunker(options?)

Creates a ChunkVeil instance.

### Options

- targetSize: number - Target chunk size in chars. Default 1000.
- overlap: number - Overlap between chunks. Default 200.
- minSize: number - Minimum chunk size. Default 100.
- separator: "auto" | "paragraph" | "sentence" | "word" | "character" - Default "auto".
- stripMarkdown: boolean - Default true.
- preserveHeadings: boolean - Default true.
- charsPerToken: number - For token estimation. Default 4.

## chunker.chunk(input, options?)

Chunks a document. Input is string or { text, source?, metadata? }.

## chunker.chunkSemantic(input, options)

Semantic chunking using embeddings. Requires embedFn.

## Chunk

- id: string
- text: string
- index: number
- startOffset: number
- endOffset: number
- metadata: ChunkMetadata

## ChunkMetadata

- source, heading, page, language
- tokenCount, charCount
- tags

## Text Processing

- cleanText(text, options?) - Normalize and clean.
- stripMarkdown(text) - Remove markdown formatting.
- extractHeadings(text) - Get heading structure.
- splitParagraphs(text), splitSentences(text), splitWords(text)
- recursiveSplit(text, targetSize) - Recursive separator-based splitting.
