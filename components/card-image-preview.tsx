"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { cn } from "@/lib/utils";

const previewGap = 12;
const viewportPadding = 12;

type PreviewPosition = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function CardImagePreview({
  src,
  alt,
  className,
  imageClassName,
  scale = 4,
}: {
  src?: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  scale?: number;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<PreviewPosition | null>(null);

  const showPreview = useCallback(() => {
    const trigger = triggerRef.current;
    if (!src || !trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = rect.width * scale;
    const height = rect.height * scale;
    const fitsRight =
      rect.right + previewGap + width <= window.innerWidth - viewportPadding;
    const preferredLeft = fitsRight
      ? rect.right + previewGap
      : rect.left - previewGap - width;

    setPosition({
      left: Math.max(
        viewportPadding,
        Math.min(preferredLeft, window.innerWidth - width - viewportPadding),
      ),
      top: Math.max(
        viewportPadding,
        Math.min(
          rect.top + (rect.height - height) / 2,
          window.innerHeight - height - viewportPadding,
        ),
      ),
      width,
      height,
    });
  }, [scale, src]);

  return (
    <>
      <div
        ref={triggerRef}
        tabIndex={src ? 0 : undefined}
        onMouseEnter={showPreview}
        onMouseLeave={() => setPosition(null)}
        onFocus={showPreview}
        onBlur={() => setPosition(null)}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-[3px] border bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        {src && (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="96px"
            className={cn("size-full object-cover", imageClassName)}
          />
        )}
      </div>
      {src &&
        position &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[100] overflow-hidden rounded-md border border-primary/40 bg-background shadow-2xl ring-1 ring-primary/15"
            style={position}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes={`${Math.round(position.width)}px`}
              className="object-cover"
            />
          </div>,
          document.body,
        )}
    </>
  );
}
