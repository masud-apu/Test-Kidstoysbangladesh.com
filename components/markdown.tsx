import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'
import Zoom from 'react-medium-image-zoom'

interface MarkdownProps {
  content: string
  className?: string
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn("prose prose-neutral dark:prose-invert max-w-none font-bengali", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Headings
          h1: ({ children }) => <h1 className="text-3xl md:text-4xl font-bold mb-6 mt-8 font-bengali">{children}</h1>,
          h2: ({ children }) => <h2 className="text-2xl md:text-3xl font-semibold mb-4 mt-6 font-bengali">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xl md:text-2xl font-medium mb-3 mt-5 font-bengali">{children}</h3>,
          h4: ({ children }) => <h4 className="text-lg md:text-xl font-medium mb-2 mt-4 font-bengali">{children}</h4>,
          h5: ({ children }) => <h5 className="text-base md:text-lg font-medium mb-2 mt-3 font-bengali">{children}</h5>,
          h6: ({ children }) => <h6 className="text-sm md:text-base font-medium mb-2 mt-3 font-bengali">{children}</h6>,

          // Paragraphs and text
          p: ({ children }) => <p className="mb-4 leading-relaxed font-bengali text-base">{children}</p>,

          // Lists
          ul: ({ children }) => <ul className="list-disc list-outside ml-6 mb-4 space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-2">{children}</ol>,
          li: ({ children }) => <li className="font-bengali leading-relaxed">{children}</li>,

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-6 py-2 my-4 italic bg-muted/30 rounded-r-lg font-bengali">
              {children}
            </blockquote>
          ),

          // Code
          code: ({ children, className }) => {
            const isInline = !className?.includes('language-')
            return isInline ? (
              <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono border border-border">
                {children}
              </code>
            ) : (
              <code className={cn(className, "text-sm")}>{children}</code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto mb-4 border border-border">
              {children}
            </pre>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border-collapse border border-border rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border hover:bg-muted/20 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-3 text-left font-semibold bg-muted/70">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-3">{children}</td>
          ),

          // Links
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-primary hover:underline font-medium transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),

          // Text formatting
          strong: ({ children }) => <strong className="font-bold font-bengali">{children}</strong>,
          em: ({ children }) => <em className="italic font-bengali">{children}</em>,
          del: ({ children }) => <del className="line-through text-muted-foreground">{children}</del>,

          // Horizontal rule
          hr: () => <hr className="my-8 border-t border-border" />,

          // Images (with responsive sizing and zoom)
          img: ({ node, ...props }) => (
            <Zoom>
              {/* eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element */}
              <img
                {...props}
                className="max-w-full h-auto rounded-lg my-4 cursor-zoom-in"
                loading="lazy"
              />
            </Zoom>
          ),
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  )
}
