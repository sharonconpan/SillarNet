import { useRef, useState } from "react";
import { UploadCloud, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);
const ALLOWED_LABEL = "JPG o PNG";

interface Props {
  onFile: (file: File) => void;
  preview: string | null;
  disabled?: boolean;
}

export default function ImageUploader({ onFile, preview, disabled }: Readonly<Props>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [typeError, setTypeError] = useState(false);

  function handleFile(file: File) {
    if (!ALLOWED_TYPES.has(file.type)) {
      setTypeError(true);
      return;
    }
    setTypeError(false);
    onFile(file);
  }

  function openPicker() {
    if (!disabled) inputRef.current?.click();
  }

  function dropBorderColor() {
    if (dragging) return "border-brand-500 bg-brand-50";
    if (typeError) return "border-red-300 bg-red-50";
    return "border-stone-200 bg-stone-50 hover:border-brand-400 hover:bg-stone-100";
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        disabled={disabled}
        aria-label="Subir imagen"
        onClick={openPicker}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "w-full text-left border-2 border-dashed cursor-pointer transition-all overflow-hidden rounded-t-2xl",
          dropBorderColor(),
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />

        {preview ? (
          <img src={preview} alt="Preview" className="w-full max-h-72 object-contain" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
            {typeError
              ? <ImageOff className="w-10 h-10 text-red-400" />
              : <UploadCloud className="w-10 h-10 text-stone-400" />
            }
            <div>
              <p className="text-sm font-medium text-stone-700">
                {typeError ? "Formato no permitido" : "Toca para subir o arrastra una imagen"}
              </p>
              <p className={cn("text-xs mt-1", typeError ? "text-red-500" : "text-stone-400")}>
                {typeError
                  ? `Solo se permiten archivos ${ALLOWED_LABEL}`
                  : `${ALLOWED_LABEL} — máx. 10 MB`}
              </p>
            </div>
          </div>
        )}
      </button>

      {typeError && (
        <div className="bg-red-50 border-x-2 border-b-2 border-red-300 rounded-b-2xl px-4 py-2.5 flex items-center gap-2">
          <ImageOff className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600 font-medium">
            Archivo no válido. Usa solo {ALLOWED_LABEL}.
          </p>
        </div>
      )}
    </div>
  );
}
