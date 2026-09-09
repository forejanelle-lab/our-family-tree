export function pageTitleFromPath(pathname: string) {
  if (pathname.startsWith("/stories/") && pathname !== "/stories") return "Story";
  const titles: Record<string, string> = {
    "/home": "Home",
    "/tree": "Tree",
    "/people": "People",
    "/photos": "Photos",
    "/stories": "Stories",
    "/sources": "Sources",
    "/settings": "Settings",
    "/import": "Import",
  };
  return titles[pathname] ?? "Family Tree";
}
