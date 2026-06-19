import React from 'react';

/**
 * Parses basic inline markdown formatting (bold, italic, links) into React elements.
 * Safe to run in both Server and Client Components.
 */
export function parseInlineMarkdown(text: any): React.ReactNode {
  if (typeof text !== 'string') return text;
  if (!text) return '';

  const regex = /(\[.*?\]\([^\s)]+\))|(\*\*.*?\*\*)|(\*.*?\*)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchText = match[0];

    // Push the text before the match
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    if (matchText.startsWith('[') && matchText.endsWith(')')) {
      // It's a link: [text](url)
      const linkMatch = matchText.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const [, linkText, url] = linkMatch;
        parts.push(
          <a
            key={matchIndex}
            href={url}
            target={url.startsWith('http') ? '_blank' : undefined}
            rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="text-orange-500 hover:text-orange-600 hover:underline transition-colors font-medium"
          >
            {parseInlineMarkdown(linkText)}
          </a>
        );
      } else {
        parts.push(matchText);
      }
    } else if (matchText.startsWith('**') && matchText.endsWith('**')) {
      // Bold text
      const boldText = matchText.slice(2, -2);
      parts.push(
        <strong key={matchIndex} className="font-bold text-black">
          {parseInlineMarkdown(boldText)}
        </strong>
      );
    } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
      // Italic text
      const italicText = matchText.slice(1, -1);
      parts.push(
        <em key={matchIndex} className="italic">
          {parseInlineMarkdown(italicText)}
        </em>
      );
    } else {
      parts.push(matchText);
    }

    lastIndex = regex.lastIndex;
  }

  // Push the remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <React.Fragment>{parts}</React.Fragment>;
}
