/**
 * Transforms JSX <Img> components inside DB article HTML content
 * into proper HTML <figure>/<a>/<img> structure for dangerouslySetInnerHTML rendering.
 *
 * DB content is a mix of HTML tags (toolbar-generated) and <Img> JSX components.
 * dangerouslySetInnerHTML doesn't process React components, so <Img href="...">
 * tags would render without the clickable <a> wrapper. This function fixes that.
 */
export function processDbContent(html: string): string {
  return html.replace(/<Img\s([^>]*?)\s*\/>/g, (_, attrs: string) => {
    function attr(name: string): string {
      const m = attrs.match(new RegExp(`${name}=["']([^"']*)["']`));
      return m ? m[1] : "";
    }

    const src   = attr("src");
    const alt   = attr("alt");
    const float = attr("float") || "none";
    const width = attr("width");
    const href  = attr("href");

    const widthPx = width
      ? /^\d+$/.test(width) ? `${width}px` : width
      : float !== "none" ? "240px" : "100%";

    const figStyle =
      float === "left"  ? `float:left;width:${widthPx};margin:0 20px 16px 0` :
      float === "right" ? `float:right;width:${widthPx};margin:0 0 16px 20px` :
                          `display:block;max-width:${widthPx};margin:0 0 16px`;

    const imgHtml = `<img src="${src}" alt="${alt}" style="width:100%;border-radius:6px;display:block;margin:0">`;
    const inner = href
      ? `<a href="${href}" target="_blank" rel="nofollow noopener noreferrer">${imgHtml}</a>`
      : imgHtml;

    return `<figure style="${figStyle}">${inner}</figure>`;
  });
}
