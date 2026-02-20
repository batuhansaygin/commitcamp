"use client";

import { useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  RemoveFormatting,
  Highlighter,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  disabled?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded text-xs transition-colors",
        "hover:bg-muted hover:text-foreground",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-0.5 h-4 w-px shrink-0 bg-border" />;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  minHeight = "144px",
  className,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const isEmpty = editor.isEmpty;
      onChange(isEmpty ? "" : html);
    },
  });

  // Sync external value changes (e.g. reset after save)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (value !== currentHtml) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-input ring-offset-background",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      {/* Toolbar */}
      {!disabled && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
          {/* History */}
          <ToolbarButton
            title="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-3 w-3" />
          </ToolbarButton>
          <ToolbarButton
            title="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-3 w-3" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text style */}
          <ToolbarButton
            title="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-3 w-3" />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-3 w-3" />
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-3 w-3" />
          </ToolbarButton>
          <ToolbarButton
            title="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-3 w-3" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            title="Heading 1"
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-3 w-3" />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-3 w-3" />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-3 w-3" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            title="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-3 w-3" />
          </ToolbarButton>
          <ToolbarButton
            title="Ordered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-3 w-3" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text color */}
          <label title="Text color" className="flex h-6 w-6 cursor-pointer items-center justify-center rounded hover:bg-muted">
            <span
              className="relative flex h-3.5 w-3.5 items-center justify-center text-[9px] font-bold leading-none"
              style={{ borderBottom: `2px solid ${editor.getAttributes("textStyle").color ?? "#000"}` }}
            >
              A
            </span>
            <input
              type="color"
              className="sr-only"
              value={editor.getAttributes("textStyle").color ?? "#000000"}
              onInput={(e) =>
                editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()
              }
            />
          </label>

          {/* Highlight */}
          <label title="Highlight color" className="flex h-6 w-6 cursor-pointer items-center justify-center rounded hover:bg-muted">
            <Highlighter className="h-3 w-3 text-muted-foreground" />
            <input
              type="color"
              className="sr-only"
              defaultValue="#fef08a"
              onInput={(e) =>
                editor.chain().focus().setHighlight({ color: (e.target as HTMLInputElement).value }).run()
              }
            />
          </label>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton
            title="Align left"
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="h-3 w-3" />
          </ToolbarButton>
          <ToolbarButton
            title="Align center"
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="h-3 w-3" />
          </ToolbarButton>
          <ToolbarButton
            title="Align right"
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="h-3 w-3" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Link */}
          <ToolbarButton
            title="Link"
            active={editor.isActive("link")}
            onClick={setLink}
          >
            <LinkIcon className="h-3 w-3" />
          </ToolbarButton>

          {/* Clear formatting */}
          <ToolbarButton
            title="Clear formatting"
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          >
            <RemoveFormatting className="h-3 w-3" />
          </ToolbarButton>
        </div>
      )}

      {/* Editor area */}
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className={cn(
          "px-3 py-2 text-sm",
          "[&_.ProseMirror]:min-h-[inherit] [&_.ProseMirror]:outline-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/60",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          // Prose styles
          "[&_.ProseMirror_h1]:text-xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-2",
          "[&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-1.5",
          "[&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mb-1",
          "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:space-y-0.5",
          "[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:space-y-0.5",
          "[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline",
          "[&_.ProseMirror_p]:leading-relaxed",
          disabled && "pointer-events-none"
        )}
      />
    </div>
  );
}
