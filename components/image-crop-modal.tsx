"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Move } from "lucide-react";

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onApply: (croppedDataUrl: string) => void;
  title?: string;
  outputSize?: number;
}

const CIRCLE_SIZE = 240;

export function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onApply,
  title = "Crop Profile Photo",
  outputSize = 512,
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setPan({ x: 0, y: 0 });
      imgRef.current = img;
    };
  }, [isOpen, imageSrc]);

  const baseScale = naturalSize
    ? Math.max(CIRCLE_SIZE / naturalSize.width, CIRCLE_SIZE / naturalSize.height)
    : 1;

  const currentWidth = naturalSize ? naturalSize.width * baseScale * zoom : CIRCLE_SIZE;
  const currentHeight = naturalSize ? naturalSize.height * baseScale * zoom : CIRCLE_SIZE;

  const maxPanX = Math.max(0, (currentWidth - CIRCLE_SIZE) / 2);
  const maxPanY = Math.max(0, (currentHeight - CIRCLE_SIZE) / 2);

  const clampedPanX = Math.min(maxPanX, Math.max(-maxPanX, pan.x));
  const clampedPanY = Math.min(maxPanY, Math.max(-maxPanY, pan.y));

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { x: clampedPanX, y: clampedPanY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = -e.deltaY * 0.0015;
    setZoom((prev) => Math.min(3, Math.max(1, Number((prev + zoomDelta).toFixed(2)))));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCrop = useCallback(() => {
    if (!imgRef.current || !naturalSize) return;

    const scaleFactor = baseScale * zoom;
    const sourceSize = CIRCLE_SIZE / scaleFactor;

    const sourceCenterX = naturalSize.width / 2 - clampedPanX / scaleFactor;
    const sourceCenterY = naturalSize.height / 2 - clampedPanY / scaleFactor;

    const sourceX = Math.max(
      0,
      Math.min(naturalSize.width - sourceSize, sourceCenterX - sourceSize / 2)
    );
    const sourceY = Math.max(
      0,
      Math.min(naturalSize.height - sourceSize, sourceCenterY - sourceSize / 2)
    );

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      imgRef.current,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      outputSize,
      outputSize
    );

    const cropped = canvas.toDataURL("image/jpeg", 0.88);
    onApply(cropped);
    onClose();
  }, [baseScale, zoom, clampedPanX, clampedPanY, naturalSize, outputSize, onApply, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center select-none bg-zinc-50/50 dark:bg-zinc-950/40">
          <div
            className="relative rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl bg-zinc-900 touch-none cursor-grab active:cursor-grabbing"
            style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {naturalSize && (
              <img
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                className="absolute pointer-events-none transition-none"
                style={{
                  width: currentWidth,
                  height: currentHeight,
                  maxWidth: "none",
                  left: CIRCLE_SIZE / 2 + clampedPanX,
                  top: CIRCLE_SIZE / 2 + clampedPanY,
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
              <div className="p-2 rounded-full bg-black/40 text-white/80 backdrop-blur-xs">
                <Move className="w-4 h-4" />
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 text-center flex items-center gap-1">
            <Move className="w-3 h-3 inline" /> Drag photo to reposition / Scroll to zoom
          </p>

          <div className="w-full mt-5 px-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, Number((prev - 0.1).toFixed(2))))}
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.02"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-emerald-600 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3, Number((prev + 0.1).toFixed(2))))}
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title="Reset position and zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Check className="w-4 h-4" /> Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
