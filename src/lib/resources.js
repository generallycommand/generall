// This module stores bookmarks only. It never fetches a URL or creates a proxy.
export const PUBLIC_SOURCE_PROVIDER = Object.freeze({
  id: "tieba-public", enabled: false, status: "static-curation-only",
});

export function safeSourceUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}

export function normalizeResources(value) {
  if (!Array.isArray(value)) return [];
  const ids = new Set();
  return value.slice(0, 200).flatMap(item => {
    if (!item || typeof item.id !== "string" || !/^[\w-]{1,64}$/.test(item.id) || ids.has(item.id)) return [];
    const url = safeSourceUrl(item.url);
    if (!url || typeof item.title !== "string" || !item.title.trim()) return [];
    ids.add(item.id);
    return [{ id: item.id, title: item.title.trim().slice(0, 100), url,
      category: ["待核实", "自我管理", "阅读笔记"].includes(item.category) ? item.category : "待核实" }];
  });
}
