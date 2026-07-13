"use client";

import { useCallback, useRef, useState } from "react";
import type { CropRect } from "@/lib/image-pipeline";

interface Props {
  file: File;
  onConfirm: (cropRect: CropRect | null) => void;
  onCancel: () => void;
}

const DISPLAY_MAX = 420;

type DragMode = "move" | "resize";
interface DragState {
  mode: DragMode;
  startX: number;
  startY: number;
  startRect: { x: number; y: number; width: number; height: number };
}

// Hand-rolled crop tool — drag the rectangle to move it, drag the corner
// handle to resize. No cropping library; everything else in the image
// pipeline is Canvas-only (see lib/image-pipeline.ts), but a real drag
// interaction is worth the custom code here.
export function ImageCropModal({ file, onConfirm, onCancel }: Props) {
  const [imgUrl] = useState(() => URL.createObjectURL(file));
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [display, setDisplay] = useState({ width: DISPLAY_MAX, height: DISPLAY_MAX });
  const [rect, setRect] = useState({ x: 20, y: 20, width: 200, height: 150 });
  const dragRef = useRef<DragState | null>(null);

  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const scale = Math.min(1, DISPLAY_MAX / img.naturalWidth, DISPLAY_MAX / img.naturalHeight);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    setNatural({ width: img.naturalWidth, height: img.naturalHeight });
    setDisplay({ width: w, height: h });
    setRect({
      x: Math.round(w * 0.1),
      y: Math.round(h * 0.1),
      width: Math.round(w * 0.8),
      height: Math.round(h * 0.8),
    });
  }

  const startDrag = useCallback(
    (mode: DragMode) => (e: React.PointerEvent) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      dragRef.current = { mode, startX: e.clientX, startY: e.clientY, startRect: rect };
    },
    [rect],
  );

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (drag.mode === "move") {
      const x = Math.min(Math.max(0, drag.startRect.x + dx), display.width - drag.startRect.width);
      const y = Math.min(Math.max(0, drag.startRect.y + dy), display.height - drag.startRect.height);
      setRect((r) => ({ ...r, x, y }));
    } else {
      const width = Math.min(Math.max(40, drag.startRect.width + dx), display.width - drag.startRect.x);
      const height = Math.min(Math.max(40, drag.startRect.height + dy), display.height - drag.startRect.y);
      setRect((r) => ({ ...r, width, height }));
    }
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function confirm() {
    const scaleX = natural.width / display.width;
    const scaleY = natural.height / display.height;
    URL.revokeObjectURL(imgUrl);
    onConfirm({
      x: Math.round(rect.x * scaleX),
      y: Math.round(rect.y * scaleY),
      width: Math.round(rect.width * scaleX),
      height: Math.round(rect.height * scaleY),
    });
  }

  function useFullPhoto() {
    URL.revokeObjectURL(imgUrl);
    onConfirm(null);
  }

  function cancel() {
    URL.revokeObjectURL(imgUrl);
    onCancel();
  }

  return (
    <div className="ops-modal-overlay" onClick={cancel}>
      <div className="ops-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ops-panel-title">Crop Photo (optional)</div>
        <div
          className="crop-stage"
          style={{ width: display.width, height: display.height }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL, not a static /public asset */}
          <img
            src={imgUrl}
            alt=""
            onLoad={onImgLoad}
            draggable={false}
            style={{ width: display.width, height: display.height, display: "block" }}
          />
          <div
            className="crop-rect"
            style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
            onPointerDown={startDrag("move")}
          >
            <div className="crop-handle" onPointerDown={startDrag("resize")} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="ops-btn" onClick={confirm}>
            Apply Crop
          </button>
          <button className="ops-btn" style={{ background: "var(--card2)", color: "var(--text)" }} onClick={useFullPhoto}>
            Use Full Photo
          </button>
          <button className="ops-btn" style={{ background: "var(--card2)", color: "var(--text)" }} onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
