import React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./ui/button";

export function CustomMarkdown({ content }: { content: string }) {
  // A very basic markdown parser to handle bold, italic, code blocks, inline code, and basic paragraphs.
  const renderTokens = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1.5 py-0.5 bg-muted text-foreground rounded-md text-sm font-mono">{part.slice(1, -1)}</code>;
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4 text-base leading-relaxed break-words">
      {blocks.map((block, i) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          const match = block.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : '';
          const code = match ? match[2] : block.slice(3, -3);

          return (
            <CodeBlock key={i} lang={lang} code={code.trim()} />
          );
        }

        // Split by double newline for paragraphs
        const paragraphs = block.split(/\n\n+/);
        return (
          <div key={i} className="space-y-2">
            {paragraphs.map((p, j) => {
              if (!p.trim()) return null;
              // Check for headers
              if (p.startsWith('### ')) return <h3 key={j} className="text-lg font-bold mt-4 mb-2">{renderTokens(p.slice(4))}</h3>;
              if (p.startsWith('## ')) return <h2 key={j} className="text-xl font-bold mt-5 mb-3">{renderTokens(p.slice(3))}</h2>;
              if (p.startsWith('# ')) return <h1 key={j} className="text-2xl font-bold mt-6 mb-4">{renderTokens(p.slice(2))}</h1>;
              
              // Handle lists simply
              if (p.includes('\n- ') || p.startsWith('- ')) {
                const items = p.split('\n').map(item => item.startsWith('- ') ? item.slice(2) : item);
                return (
                  <ul key={j} className="list-disc pl-5 space-y-1">
                    {items.map((item, k) => item.trim() && <li key={k}>{renderTokens(item)}</li>)}
                  </ul>
                );
              }

              return <p key={j}>{renderTokens(p)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function CodeBlock({ lang, code }: { lang: string, code: string }) {
  const [copied, setCopied] = React.useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-border my-4">
      <div className="flex items-center justify-between px-4 py-1.5 bg-muted/50 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground">{lang || 'text'}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <div className="p-4 bg-black/50 overflow-x-auto">
        <pre className="text-sm font-mono text-gray-200">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
