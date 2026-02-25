/**
 * Convert a string to a URL-friendly slug
 * - Converts to lowercase
 * - Removes special characters
 * - Replaces spaces and underscores with hyphens
 * - Removes consecutive hyphens
 * - Trims hyphens from start and end
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/_/g, '-') // Replace underscores with -
    .replace(/[^\w-.]+/g, '') // Remove all non-word chars except hyphens and dots
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}
