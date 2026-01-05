/**
 * Detects structured content (JSON, code) and wraps it in code fences
 * to preserve indentation that would otherwise be stripped by markdown
 */
export const preprocessMessageContent = (content: string): string => {
    // Skip if already wrapped in code fence
    if (content.trim().startsWith('```')) {
        return content;
    }

    const trimmed = content.trim();
    const lines = trimmed.split('\n');

    // Pattern 1: JSON - starts with { or [ and has multiple lines with indentation
    const looksLikeJSON = (trimmed.startsWith('{') || trimmed.startsWith('[')) &&
        trimmed.includes('\n') &&
        /^\s{2,}/m.test(content);

    // Pattern 2: Generic structured content - >40% of lines have 2+ leading spaces
    const indentedLines = lines.filter(line => /^\s{2,}/.test(line));
    const hasSignificantIndentation = lines.length >= 3 &&
        (indentedLines.length / lines.length) > 0.4;

    // If it looks like structured content, wrap in code fence
    if (looksLikeJSON || hasSignificantIndentation) {
        // Auto-detect language for syntax highlighting
        let language = 'text';

        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            language = 'json';
        } else if (/^(import|export|const|let|var|function)\s+/.test(trimmed)) {
            language = 'javascript';
        } else if (/^(def |class |import |from .+ import)/.test(trimmed)) {
            language = 'python';
        } else if (/^---\n/.test(trimmed) || /:\s*\n\s{2,}/.test(trimmed)) {
            language = 'yaml';
        } else if (/^(func |package |import \()/.test(trimmed)) {
            language = 'go';
        } else if (/^(<\?php|namespace |use |class )/m.test(trimmed)) {
            language = 'php';
        } else if (/^(interface |type |class |namespace )/m.test(trimmed) && /:\s*\w+/.test(trimmed)) {
            language = 'typescript';
        }

        return `\`\`\`${language}\n${trimmed}\n\`\`\``;
    }

    return content;
};