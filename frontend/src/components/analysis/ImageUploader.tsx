import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFile: (file: File) => void;
  preview: string | null;
  disabled?: boolean;
}

export default function ImageUploader({ onFile, preview, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    onFile(file);
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      className={cn(
        "relative border-2 border-dashed rounded-xl cursor-pointer transition-colors overflow-hidden",
        dragging ? "border-brand-500 bg-brand-50" : "border-gray-300 bg-gray-50 hover:border-brand-400 hover:bg-gray-100",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {preview ? (
        <img
          src={preview}
          alt="Preview"
          className="w-full max-h-72 object-contain rounded-xl"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
          <UploadCloud className="w-10 h-10 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700">Haz clic o arrastra una imagen</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG o WebP — máx. 10 MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
