const OPENVERSE_BASE = "https://api.openverse.org/v1/images/";

// Openly-licensed photo search (Flickr, Wikimedia Commons, museums, etc.),
// used for "find a photo online" — there's no free, CORS-friendly, key-less
// way to query Google Images directly from a browser, and scraping it would
// violate Google's terms of service, so Openverse is the closest equivalent
// that actually works from a client-only app.
export async function searchImages(query, { signal, pageSize = 20 } = {}) {
  const url = `${OPENVERSE_BASE}?q=${encodeURIComponent(query)}&page_size=${pageSize}&mature=false`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Image search failed (${res.status})`);
  const data = await res.json();
  return (data.results || [])
    .filter((r) => r.thumbnail || r.url)
    .map((r) => ({
      id: r.id,
      title: r.title || "Untitled",
      thumbnail: r.thumbnail || r.url,
      fullUrl: r.url,
      creator: r.creator || null,
      license: (r.license || "").toUpperCase(),
      sourceUrl: r.foreign_landing_url || null,
    }));
}

// Openverse matches all words in a query (no fuzziness), so a specific
// compound query like "<unit name> warhammer 40k" often returns nothing even
// when the bare unit name alone has plenty of hits. Try progressively
// broader variants and stop at the first one with results.
export async function searchImagesWithFallback(query, options = {}) {
  const trimmed = query.trim();
  const words = trimmed.split(/\s+/);
  const variants = [trimmed];
  if (!/warhammer/i.test(trimmed)) variants.push(`${trimmed} warhammer`);
  if (words.length > 2) variants.push(words.slice(0, 2).join(" "));
  if (words.length > 1) variants.push(words[0]);

  for (const variant of [...new Set(variants)]) {
    const results = await searchImages(variant, options);
    if (results.length > 0) return { query: variant, results };
  }
  return { query: trimmed, results: [] };
}

// Downloads the full-resolution image, falling back to the thumbnail if the
// source host doesn't allow it (some third-party hosts don't send CORS
// headers, in which case the fetch itself fails outright).
export async function downloadImageBlob(result) {
  const candidates = [result.fullUrl, result.thumbnail].filter(Boolean);
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const blob = await res.blob();
      if (blob && blob.size > 0) return blob;
    } catch {
      // try the next candidate
    }
  }
  throw new Error("Couldn't download this image.");
}
