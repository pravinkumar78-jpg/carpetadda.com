import { useRef, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { X, UploadSimple, CircleNotch } from "@phosphor-icons/react";

const toUrl = (resp) => (resp && typeof resp === "object" ? resp.url : resp) || "";

/**
 * Multi-image gallery upload: pick many files at once, preview them, remove
 * individual ones before upload, then upload all in order. Uploaded URLs are
 * appended to the parent's array via onAdd(urls).
 */
export default function MultiImageUpload({ onAdd, kind = "properties", dataTestid = "multi-image-upload" }) {
  const inputRef = useRef(null);
  const [pending, setPending] = useState([]); // [{file, preview}]
  const [busy, setBusy] = useState(false);

  const pick = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const imgs = files.filter(f => (f.type || "").startsWith("image/"));
    if (imgs.length !== files.length) toast.error("Only image files are allowed");
    setPending(prev => [...prev, ...imgs.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
    e.target.value = "";
  };

  const remove = (i) => {
    setPending(prev => {
      URL.revokeObjectURL(prev[i]?.preview);
      return prev.filter((_, j) => j !== i);
    });
  };

  const uploadAll = async () => {
    if (!pending.length || busy) return;
    setBusy(true);
    const uploaded = [];
    try {
      for (const item of pending) {
        const fd = new FormData();
        fd.append("file", item.file);
        let resp;
        try {
          resp = await api.post(`/admin/uploads?kind=${encodeURIComponent(kind)}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        } catch (err) {
          if (err?.response?.status !== 403) throw err;
          resp = await api.post(`/uploads?kind=${encodeURIComponent(kind)}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        }
        uploaded.push(toUrl(resp.data));
      }
      onAdd(uploaded.filter(Boolean));
      pending.forEach(p => URL.revokeObjectURL(p.preview));
      setPending([]);
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} added to gallery`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || "Upload failed");
    } finally { setBusy(false); }
  };

  return (
    <div data-testid={dataTestid} className="w-full">
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" data-testid={`${dataTestid}-input`} onChange={pick} />
      <button type="button" onClick={() => inputRef.current?.click()} data-testid={`${dataTestid}-pick`}
        className="w-full h-28 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors">
        <UploadSimple size={22} />
        <span className="text-sm font-medium">Select multiple images</span>
        <span className="text-xs text-slate-400">JPG/PNG/WEBP · max 8 MB each</span>
      </button>

      {pending.length > 0 && (
        <div className="mt-3">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {pending.map((p, i) => (
              <div key={p.preview} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <img src={p.preview} alt={`Selected ${i + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => remove(i)} data-testid={`${dataTestid}-remove-${i}`} aria-label={`Remove image ${i + 1}`}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/70 text-white flex items-center justify-center opacity-90 hover:bg-rose-600 transition-colors">
                  <X size={12} weight="bold" />
                </button>
                <span className="absolute bottom-1 left-1 text-[10px] bg-slate-900/60 text-white px-1.5 py-0.5 rounded">{i + 1}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={uploadAll} disabled={busy} data-testid={`${dataTestid}-upload`}
            className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
            {busy ? <CircleNotch size={15} className="animate-spin" /> : <UploadSimple size={15} weight="bold" />}
            {busy ? "Uploading…" : `Upload ${pending.length} image${pending.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}
    </div>
  );
}
