import { useEffect, useRef, useState } from "react";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Link as LinkIcon, Link2Off, List, ListOrdered, Heading2, Quote, Undo, Redo } from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

/**
 * Minimal WordPress-style rich text editor based on contentEditable + execCommand.
 * Supports: bold, italic, hyperlink (insert/remove), headings, lists, blockquote, undo/redo.
 * Image uploads in the article are handled by the dedicated Image block in ArticleEditor.
 */
export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  // Sync external value -> DOM when it differs (avoid clobbering caret while typing)
  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  function exec(cmd: string, arg?: string) {
    ref.current?.focus();
    // eslint-disable-next-line deprecation/deprecation
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML || "");
  }

  function addLink() {
    const url = window.prompt("Enter URL (https://…)");
    if (!url) return;
    let href = url.trim();
    if (!/^https?:\/\//i.test(href) && !href.startsWith("mailto:")) {
      href = "https://" + href;
    }
    exec("createLink", href);
    // Make new links open in a new tab
    const links = ref.current?.querySelectorAll("a");
    links?.forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer nofollow");
    });
    onChange(ref.current?.innerHTML || "");
  }

  return (
    <div className={`rounded-md border ${focused ? "border-ring ring-2 ring-ring" : "border-input"} bg-background`}>
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-1.5">
        <TBtn label="Bold (Ctrl+B)" onClick={() => exec("bold")}><Bold className="h-3.5 w-3.5" /></TBtn>
        <TBtn label="Italic (Ctrl+I)" onClick={() => exec("italic")}><Italic className="h-3.5 w-3.5" /></TBtn>
        <Sep />
        <TBtn label="Heading" onClick={() => exec("formatBlock", "H3")}><Heading2 className="h-3.5 w-3.5" /></TBtn>
        <TBtn label="Quote" onClick={() => exec("formatBlock", "BLOCKQUOTE")}><Quote className="h-3.5 w-3.5" /></TBtn>
        <Sep />
        <TBtn label="Bulleted list" onClick={() => exec("insertUnorderedList")}><List className="h-3.5 w-3.5" /></TBtn>
        <TBtn label="Numbered list" onClick={() => exec("insertOrderedList")}><ListOrdered className="h-3.5 w-3.5" /></TBtn>
        <Sep />
        <TBtn label="Insert link" onClick={addLink}><LinkIcon className="h-3.5 w-3.5" /></TBtn>
        <TBtn label="Remove link" onClick={() => exec("unlink")}><Link2Off className="h-3.5 w-3.5" /></TBtn>
        <Sep />
        <TBtn label="Undo" onClick={() => exec("undo")}><Undo className="h-3.5 w-3.5" /></TBtn>
        <TBtn label="Redo" onClick={() => exec("redo")}><Redo className="h-3.5 w-3.5" /></TBtn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onInput={() => onChange(ref.current?.innerHTML || "")}
        data-placeholder={placeholder || "Write your paragraph…"}
        className="prose prose-neutral max-w-none px-3 py-2 min-h-[140px] text-sm leading-7 outline-none [&_a]:text-primary [&_a]:underline empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}

function TBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-0.5 h-5 w-px bg-border" />;
}
