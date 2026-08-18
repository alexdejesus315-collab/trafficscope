import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { useState, useRef } from 'react';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { supabase } from '../lib/supabaseClient';
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link as LinkIcon,
  Image as ImageIcon, X, Check, Loader2, Palette, Highlighter,
} from 'lucide-react';

const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

turndownService.addRule('coloredText', {
  filter: (node) => node.nodeName === 'SPAN' && !!node.getAttribute('style')?.includes('color'),
  replacement: (content, node) => {
    const style = (node as HTMLElement).getAttribute('style') || '';
    return `<span style="${style}">${content}</span>`;
  },
});

turndownService.addRule('highlightMark', {
  filter: 'mark',
  replacement: (content, node) => {
    const style = (node as HTMLElement).getAttribute('style') || '';
    return `<mark style="${style}">${content}</mark>`;
  },
});
interface ArticleSource {
  title: string;
  url: string;
}

interface ArticleEditorProps {
  initialContent: string; // markdown
  initialTitle: string;
  initialSources?: ArticleSource[];
  showSources?: boolean;
  showVideoField?: boolean;
  initialVideoUrl?: string;
  onSave: (data: { title: string; markdown: string; sources: ArticleSource[]; youtubeUrl?: string }) => Promise<void>;
  onClose: () => void;
  heading?: string;
}

export default function ArticleEditor({ initialContent, initialTitle, initialSources = [], showSources = true, showVideoField = false, initialVideoUrl = '', onSave, onClose, heading = 'Editar artigo' }: ArticleEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [articleTitle, setArticleTitle] = useState(initialTitle);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [sources, setSources] = useState<ArticleSource[]>(initialSources);
  const [youtubeUrl, setYoutubeUrl] = useState(initialVideoUrl);

  const addSource = () => setSources([...sources, { title: '', url: '' }]);
  const removeSource = (index: number) => setSources(sources.filter((_, i) => i !== index));
  const updateSource = (index: number, field: 'title' | 'url', value: string) => {
    setSources(sources.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ HTMLAttributes: { class: 'rounded-xl' } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Placeholder.configure({ placeholder: 'Escreve o conteúdo do artigo...' }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: marked.parse(initialContent || '') as string,
    editorProps: {
      attributes: {
        spellcheck: 'false',
      },
    },
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Falha ao enviar imagem.');
      return data.url;
    } catch (err: any) {
      alert(err.message || 'Falha ao enviar imagem.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;

    const url = await uploadImage(file);
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleOpenLinkInput = () => {
    if (!editor) return;
    if (editor.state.selection.empty && !editor.isActive('link')) {
      alert('Seleciona primeiro a palavra ou frase que queres transformar em link.');
      return;
    }
    setLinkUrl(editor.getAttributes('link').href || 'https://');
    setShowLinkInput(true);
  };

  const applyLink = () => {
    if (!editor) return;
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run();
    }
    setShowLinkInput(false);
  };

  const handleSave = async () => {
    if (!editor) return;
    if (!articleTitle.trim()) {
      alert('O título não pode ficar vazio.');
      return;
    }
    setIsSaving(true);
    try {
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      await onSave({ title: articleTitle.trim(), markdown, sources: sources.filter((s) => s.title.trim() && s.url.trim()), youtubeUrl: youtubeUrl.trim() });
    } catch (err: any) {
      alert(err.message || 'Falha ao guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) return null;

  const toolbarButtonClass = (isActive: boolean) =>
    `flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 h-16 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground">{heading}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {isSaving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
<div className="flex items-center gap-1 px-4 md:px-6 h-14 border-b border-border shrink-0 overflow-visible relative z-20 bg-card">        <button onClick={() => editor.chain().focus().toggleBold().run()} className={toolbarButtonClass(editor.isActive('bold'))} title="Negrito">
          <Bold className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={toolbarButtonClass(editor.isActive('italic'))} title="Itálico">
          <Italic className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={toolbarButtonClass(editor.isActive('heading', { level: 2 }))} title="Título 2">
          <Heading2 className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={toolbarButtonClass(editor.isActive('heading', { level: 3 }))} title="Título 3">
          <Heading3 className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={toolbarButtonClass(editor.isActive('bulletList'))} title="Lista">
          <List className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={toolbarButtonClass(editor.isActive('orderedList'))} title="Lista numerada">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={toolbarButtonClass(editor.isActive('blockquote'))} title="Citação">
          <Quote className="h-4 w-4" />
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <div className="relative">
          <button onClick={handleOpenLinkInput} className={toolbarButtonClass(editor.isActive('link'))} title="Link">
            <LinkIcon className="h-4 w-4" />
          </button>
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg p-2 flex items-center gap-1.5 z-30 shadow-md">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyLink();
                  if (e.key === 'Escape') setShowLinkInput(false);
                }}
                placeholder="https://"
                autoFocus
                className="w-56 bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
              />
              <button onClick={applyLink} className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setShowLinkInput(false)} className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <div className="w-px h-5 bg-border mx-1" />
        <label className={toolbarButtonClass(false) + ' cursor-pointer relative'} title="Cor do texto">
          <Palette className="h-4 w-4" />
          <input
            type="color"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
        <div className="relative group">
          <button className={toolbarButtonClass(editor.isActive('highlight'))} title="Marca-texto">
            <Highlighter className="h-4 w-4" />
          </button>
<div className="hidden group-hover:flex absolute top-full left-0 mt-1 bg-card border border-border rounded-lg p-1.5 gap-1 z-30 shadow-md">            {['#FEF08A', '#BBF7D0', '#BFDBFE', '#FBCFE8'].map((color) => (
              <button
                key={color}
                onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                className="h-5 w-5 rounded-full border border-border"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <button
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              className="h-5 w-5 rounded-full border border-border flex items-center justify-center"
              title="Remover marca-texto"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
        <button onClick={handleImageButtonClick} disabled={isUploading} className={toolbarButtonClass(false)} title="Inserir imagem">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
          <input
            type="text"
            value={articleTitle}
            onChange={(e) => setArticleTitle(e.target.value)}
            placeholder="Título do artigo..."
            className="w-full mb-6 bg-transparent text-3xl md:text-4xl font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none border-b border-transparent focus:border-border pb-2 transition-colors"
          />
          <EditorContent
            editor={editor}
            className="prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-headings:font-bold prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-a:text-primary prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-li:text-muted-foreground focus:outline-none min-h-[400px]"
          />

          {showSources && (
          <div className="mt-10 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Fontes</h3>
              <button
                onClick={addSource}
                className="text-xs font-medium text-primary hover:underline"
              >
                + Adicionar fonte
              </button>
            </div>
            <div className="space-y-2">
              {sources.map((source, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={source.title}
                    onChange={(e) => updateSource(i, 'title', e.target.value)}
                    placeholder="Título da fonte"
                    className="flex-1 bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    value={source.url}
                    onChange={(e) => updateSource(i, 'url', e.target.value)}
                    placeholder="https://"
                    className="flex-1 bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => removeSource(i)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                    title="Remover fonte"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {sources.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma fonte adicionada.</p>
              )}
            </div>
          </div>
          )}

          {showVideoField && (
          <div className="mt-10 pt-6 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Vídeo do YouTube</h3>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... (deixa vazio para remover)"
              className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          )}
        </div>
      </div>
    </div>
  );
}