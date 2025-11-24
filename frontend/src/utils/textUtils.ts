/**
 * Utility to filter out (Refusal: true) or similar patterns from AI message content
 */
export function filterRefusalText(content: string): string {
  // Remove (Refusal: true)
  let cleaned = content.replace(/\(Refusal: ?true\)/gi, '');

  // Remove trailing asterisks, underscores, and empty lines
  cleaned = cleaned.replace(/([\n\r]+[ \t]*([*]{2,}|_{2,})[ \t]*)+$/g, '');

  // Remove any trailing whitespace or empty lines
  cleaned = cleaned.replace(/[\n\r]+$/g, '').trim();

  return cleaned;
}

/**
 * Format timestamp to readable time
 */
export function formatTime(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}
