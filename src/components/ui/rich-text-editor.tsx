"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Quote,
} from "lucide-react";

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start writing...",
  className,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[200px] p-4 focus:outline-none",
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bold") && "bg-muted"
          )}
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("italic") && "bg-muted"
          )}
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("heading", { level: 2 }) && "bg-muted"
          )}
          disabled={disabled}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("heading", { level: 3 }) && "bg-muted"
          )}
          disabled={disabled}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bulletList") && "bg-muted"
          )}
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("orderedList") && "bg-muted"
          )}
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("blockquote") && "bg-muted"
          )}
          disabled={disabled}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}

// Read-only renderer for displaying rich text content
interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export function RichTextDisplay({ content, className }: RichTextDisplayProps) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
