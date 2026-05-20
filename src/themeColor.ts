function getThemeColorMeta(): HTMLMetaElement | null {
  if (typeof document === "undefined") return null;

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head?.appendChild(meta);
  }

  return meta;
}

export function setThemeColor(color: string): void {
  if (!color) return;

  const meta = getThemeColorMeta();
  if (!meta) return;

  meta.setAttribute("content", color);
}

export function setThemeColorFromElement(element: Element | null | undefined): void {
  if (typeof window === "undefined" || !element) return;

  const color = window.getComputedStyle(element).backgroundColor;
  setThemeColor(color);
}
