/** Extract YouTube embed URL from watch/share link; returns embed URL or null */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  const watchMatch = u.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = u.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const embedMatch = u.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return u;
  return null;
}
