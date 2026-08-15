"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { MediaPickerDialog } from "@/components/admin/media/media-picker-dialog";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  s3Configured?: boolean;
  origin?: string;
};

export function TiptapEditor({
  value,
  onChange,
  placeholder,
  s3Configured = false,
  origin = "page",
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({
        placeholder: placeholder ?? "Введите текст…",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "tiptap-editor min-h-[200px] px-3 py-2 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Синхронизация при сбросе извне (например, после initial fetch или reset формы)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value && !editor.isFocused) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
     
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
        Загрузка редактора…
      </div>
    );
  }

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL ссылки", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }

  return (
    <div className="rounded-md border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b p-1">
        <ToolBtn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Жирный"
        >
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Курсив"
        >
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolBtn
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="H2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="H3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolBtn>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolBtn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Список"
        >
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Нумерованный список"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Цитата"
        >
          <Quote className="h-4 w-4" />
        </ToolBtn>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolBtn
          active={editor.isActive("link")}
          onClick={setLink}
          title="Ссылка"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => setPickerOpen(true)}
          title="Изображение из медиатеки"
        >
          <ImageIcon className="h-4 w-4" />
        </ToolBtn>
        <span className="ml-auto" />
        <ToolBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </ToolBtn>
      </div>

      <EditorContent editor={editor} />

      {/* Скрытый dialog-триггер picker'а используется через controlledOpen */}
      <MediaPickerDialog
        triggerLabel=""
        triggerClassName="hidden"
        controlledOpen={pickerOpen}
        onOpenChange={setPickerOpen}
        s3Configured={s3Configured}
        origin={origin}
        onSelect={(asset) => {
          editor
            .chain()
            .focus()
            .setImage({ src: asset.url, alt: asset.alt ?? "" })
            .run();
        }}
      />
    </div>
  );
}

function ToolBtn({
  children,
  active,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground",
      )}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
