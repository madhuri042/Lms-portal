/** Extract YouTube embed URL from watch/share link or iframe string; returns embed URL or null */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  let u = url.trim();

  // If the user pasted a full iframe HTML string, extract the src attribute
  const iframeMatch = u.match(/<iframe.*?src=["'](.*?)["']/i);
  if (iframeMatch) {
    u = iframeMatch[1];
  }

  // Find the generic 11-character video ID in the URL structure
  const match = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/i);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  
  return null;
}
