import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";

import { Button } from "./ui/Button";

interface RichTextEditorProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder ?? "Write here..."
      })
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "tiptap rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-ink focus:outline-none"
      }
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    }
  });

  // Update editor content when value prop changes (e.g., when loading a question for editing)
  useEffect(() => {
    if (editor && value) {
      const currentContent = editor.getHTML();
      // Only update if content is different to avoid unnecessary updates
      if (currentContent !== value) {
        editor.commands.setContent(value);
      }
    }
  }, [editor, value]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => editor?.chain().focus().toggleBold().run()}>
          Bold
        </Button>
        <Button type="button" variant="secondary" onClick={() => editor?.chain().focus().toggleItalic().run()}>
          Italic
        </Button>
        <Button type="button" variant="secondary" onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          Bullets
        </Button>
        <Button type="button" variant="secondary" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          Numbers
        </Button>
      </div>
      <EditorContent editor={editor} />
      <p className="text-xs text-muted">Math is supported by typing LaTeX delimiters like `$x^2$` or `$$E=mc^2$$`.</p>
    </div>
  );
}
