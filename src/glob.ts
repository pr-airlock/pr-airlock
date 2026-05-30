export function matchesAny(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesGlob(path, pattern));
}

export function matchesGlob(path: string, pattern: string): boolean {
  const normalizedPath = path.replace(/\\/g, "/");
  const normalizedPattern = pattern.replace(/\\/g, "/");
  const regex = new RegExp(`^${escapeGlob(normalizedPattern)}$`);
  return regex.test(normalizedPath);
}

function escapeGlob(pattern: string): string {
  return pattern
    .replace(/\*\*\//g, "__DOUBLE_STAR_SLASH__")
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "__DOUBLE_STAR__")
    .replace(/\*/g, "[^/]*")
    .replace(/__DOUBLE_STAR_SLASH__/g, "(?:.*/)?")
    .replace(/__DOUBLE_STAR__/g, ".*");
}
