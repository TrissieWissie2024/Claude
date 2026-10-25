/**
 * True when `href` is the current page. Exact match, ignoring a trailing
 * slash, so aria-current="page" only ever marks the page itself.
 */
export function isCurrentPage(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const normalize = (path: string) => path.replace(/\/+$/, "") || "/";
  return normalize(pathname) === normalize(href);
}
