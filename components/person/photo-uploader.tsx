"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export function PhotoUploader({
  value,
  onChange,
  label = "Add a photo",
  size = "lg",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  size?: "md" | "lg";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const readFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        onChange(String(reader.result || ""));
      };
      reader.readAsDataURL(file);
    },
    [onChange],
  );

  const dim = size === "lg" ? "h-36 w-36" : "h-24 w-24";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center overflow-hidden rounded-full border border-dashed border-line bg-white text-center transition-colors",
          dim,
          dragging && "border-forest bg-sage-soft",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) readFile(file);
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Portrait preview" className="h-full w-full object-cover" />
        ) : (
          <div className="px-4">
            <span className="mb-1 block text-2xl text-forest">+</span>
            <span className="block text-[11px] leading-tight text-soft">{label}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
          <ImagePlus className="h-3.5 w-3.5" />
          {value ? "Replace" : "Upload"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => cameraRef.current?.click()}>
          <Camera className="h-3.5 w-3.5" />
          Camera
        </Button>
        {value ? (
          <Button size="sm" variant="ghost" onClick={() => onChange("")}>
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) readFile(file);
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) readFile(file);
        }}
      />
    </div>
  );
}
