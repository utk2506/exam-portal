import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import renderMathInElement from "katex/contrib/auto-render";

export function MathHtml({ html, className = "" }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    renderMathInElement(ref.current, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className={`prose-html text-sm leading-7 text-ink ${className}`}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}
