import { useEffect, useRef, useState } from "react";
import { TextB, TextItalic, TextUnderline, ListBullets, ListNumbers, TextAlignLeft, TextAlignCenter, TextAlignRight } from "@phosphor-icons/react";

const SIZES = [["2", "Small"], ["3", "Normal"], ["4", "Large"], ["5", "X-Large"]];

export default function RichTextEditor({ value, onChange, dataTestid = "rich-editor", placeholder = "Write a description…" }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (ref.current && !focused && ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
  }, [value, focused]);

  const exec = (cmd, arg = null) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML || "");
  };

  const Btn = ({ cmd, arg, title, children, tid }) => (
    <button
      type="button"
      title={title}
      data-testid={`${dataTestid}-${tid}`}
      onMouseDown={e => { e.preventDefault(); exec(cmd, arg); }}
      className="w-8 h-8 inline-flex items-center justify-center rounded-md text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
    >
      {children}
    </button>
  );

  return (
    <div data-testid={dataTestid} className="border border-slate-200 rounded-lg overflow-hidden bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50 flex-wrap">
        <Btn cmd="bold" title="Bold" tid="bold"><TextB size={15} weight="bold" /></Btn>
        <Btn cmd="italic" title="Italic" tid="italic"><TextItalic size={15} /></Btn>
        <Btn cmd="underline" title="Underline" tid="underline"><TextUnderline size={15} /></Btn>
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <select
          data-testid={`${dataTestid}-fontsize`}
          defaultValue=""
          onChange={e => { if (e.target.value) { exec("fontSize", e.target.value); e.target.value = ""; } }}
          onMouseDown={e => e.stopPropagation()}
          className="h-8 text-xs border border-slate-200 rounded-md px-1.5 text-slate-600 bg-white"
        >
          <option value="" disabled>Size</option>
          {SIZES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <Btn cmd="insertUnorderedList" title="Bullet list" tid="ul"><ListBullets size={15} /></Btn>
        <Btn cmd="insertOrderedList" title="Numbered list" tid="ol"><ListNumbers size={15} /></Btn>
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <Btn cmd="justifyLeft" title="Align left" tid="align-left"><TextAlignLeft size={15} /></Btn>
        <Btn cmd="justifyCenter" title="Align center" tid="align-center"><TextAlignCenter size={15} /></Btn>
        <Btn cmd="justifyRight" title="Align right" tid="align-right"><TextAlignRight size={15} /></Btn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-testid={`${dataTestid}-input`}
        data-placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onInput={() => onChange(ref.current?.innerHTML || "")}
        className="min-h-[140px] px-4 py-3 text-sm text-slate-800 leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
      />
    </div>
  );
}
