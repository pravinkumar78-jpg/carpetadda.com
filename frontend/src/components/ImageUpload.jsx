import { useEffect, useRef, useState } from "react";
import { UploadSimple, X, Image as ImageIcon, LinkSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";

/**
 * Drag-drop image uploader with URL paste fallback.
 * Props:
 *   value    — current image URL (backend path or full URL)
 *   onChange — (newUrl: string) => void
 *   kind     — bucket-namespace hint: blogs | testimonials | og | general
 *   label    — optional field label above the drop zone
 *   dataTestid — root testid; child testids are derived from it
 */
export default function ImageUpload({ value, onChange, kind = "general", label, dataTestid = "image-upload", accept = "image/*", allowUrl = true }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const uploadFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please pick an image file"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image must be under 8 MB"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      let data;
      try {
        ({ data } = await api.post(`/admin/uploads?kind=${encodeURIComponent(kind)}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        }));
      } catch (err) {
        if (err?.response?.status !== 403) throw err;
        ({ data } = await api.post(`/uploads?kind=${encodeURIComponent(kind)}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        }));
      }
      onChange(data.url);
      toast.success("Uploaded");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally { setUploading(false); }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const preview = value ? (value.startsWith("/api/") ? value : value) : null;
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [value]); // retry preview when the URL changes (e.g. after Replace)

  return (
    <div data-testid={dataTestid}>
      {label && <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>}

      {preview ? (
        <div className="relative group card-premium overflow-hidden p-0">
          {broken ? (
            <div className="w-full h-40 bg-slate-100 flex flex-col items-center justify-center gap-1.5 text-slate-400" data-testid={`${dataTestid}-broken`}>
              <ImageIcon size={22} />
              <span className="text-xs font-medium">Preview unavailable — use Replace or remove</span>
            </div>
          ) : (
            <img src={preview} alt="" className="w-full h-40 object-cover bg-slate-100" onError={() => setBroken(true)} />
          )}
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} data-testid={`${dataTestid}-replace`} className="px-2.5 py-1.5 rounded-md bg-white/95 backdrop-blur text-xs font-medium text-slate-700 shadow hover:bg-white">
              {uploading ? "Uploading…" : "Replace"}
            </button>
            <button type="button" onClick={() => onChange("")} data-testid={`${dataTestid}-clear`} className="w-7 h-7 rounded-md bg-white/95 backdrop-blur text-slate-700 shadow hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center">
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <label
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            dragOver ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40"
          }`}
          data-testid={`${dataTestid}-dropzone`}
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
            {uploading ? <UploadSimple size={18} weight="bold" className="animate-pulse" /> : <ImageIcon size={18} weight="bold" />}
          </div>
          <div className="text-sm font-medium text-slate-700">
            {uploading ? "Uploading…" : "Drop image here"}
          </div>
          <div className="text-xs text-slate-500 mt-1">or click to browse · JPG, PNG, WebP · max 8&nbsp;MB</div>
        </label>
      )}

      <input ref={inputRef} type="file" accept={accept} className="hidden" data-testid={`${dataTestid}-input`}
        onChange={e => uploadFile(e.target.files?.[0])} />

      <div className="mt-2 flex items-center gap-3 text-xs">
        {!preview && (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="text-blue-600 hover:underline font-medium">Choose file</button>
        )}
        {allowUrl && <button type="button" onClick={() => setShowUrl(v => !v)} className="text-slate-500 hover:text-blue-600 inline-flex items-center gap-1">
          <LinkSimple size={12} /> {showUrl ? "Hide URL input" : "Or paste URL"}
        </button>}
      </div>
      {allowUrl && showUrl && (
        <Input
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          placeholder="https://…"
          className="h-10 mt-2 rounded-lg border-slate-200 text-sm"
          data-testid={`${dataTestid}-url`}
        />
      )}
    </div>
  );
}
