import type { CSSProperties } from "react";

interface Props {
  src: string;
  alt?: string;
  /** "left" | "right" | "none" (default) */
  float?: string;
  /** width without unit = px, e.g. "240"; or "50%" */
  width?: string;
  /** product link — rendered with rel=nofollow */
  href?: string;
}

export default function MdxImg({
  src,
  alt = "",
  float = "none",
  width,
  href,
}: Props) {
  const widthVal = width
    ? width.match(/^\d+$/) ? `${width}px` : width
    : float !== "none" ? "240px" : "100%";

  const figStyle: CSSProperties =
    float === "left"
      ? { float: "left", width: widthVal, margin: "0 20px 16px 0" }
      : float === "right"
      ? { float: "right", width: widthVal, margin: "0 0 16px 20px" }
      : { display: "block", maxWidth: widthVal, margin: "0 0 16px" };

  const imgEl = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={{ width: "100%", borderRadius: "6px", display: "block", margin: 0 }}
    />
  );

  return (
    <figure style={figStyle}>
      {href ? (
        <a href={href} target="_blank" rel="nofollow noopener noreferrer">
          {imgEl}
        </a>
      ) : (
        imgEl
      )}
    </figure>
  );
}
