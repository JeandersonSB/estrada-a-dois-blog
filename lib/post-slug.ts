/**
 * Article slugs are CMS-generated identifiers, never arbitrary filesystem paths.
 */
export function normalizePostSlug(input: string): string | null {
  if (!input || input.length > 240) return null;
  try {
    const slug = decodeURIComponent(input);
    if (slug.length > 180 || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) return null;
    return slug;
  } catch {
    return null;
  }
}
