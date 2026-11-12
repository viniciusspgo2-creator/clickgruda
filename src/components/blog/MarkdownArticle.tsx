'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renderiza o conteúdo Markdown dos artigos criados no admin.
 * Estilos próprios (Tailwind) — sem depender do plugin de typography.
 */
export function MarkdownArticle({ content }: { content: string }) {
  return (
    <div className="markdown-article">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="mb-4 mt-10 text-2xl font-black tracking-tight text-zinc-950 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-8 text-xl font-extrabold tracking-tight text-zinc-950">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-5 text-[15px] leading-[1.85] text-zinc-700 sm:text-base">{children}</p>,
          ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-6 text-[15px] leading-[1.85] text-zinc-700 sm:text-base">{children}</ul>,
          ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2 pl-6 text-[15px] leading-[1.85] text-zinc-700 sm:text-base">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-extrabold text-zinc-900">{children}</strong>,
          a: ({ href, children }) => (
            <a href={href} className="font-semibold text-orange-600 underline underline-offset-4 hover:text-orange-700">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-5 rounded-r-2xl border-l-4 border-orange-500 bg-orange-50/70 px-5 py-4 text-[15px] leading-relaxed text-zinc-700">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="mb-6 overflow-x-auto rounded-2xl border border-zinc-200">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-zinc-950 text-left text-white">{children}</thead>,
          th: ({ children }) => <th className="px-4 py-3 font-bold">{children}</th>,
          td: ({ children }) => <td className="border-t border-zinc-200 px-4 py-3 align-top text-zinc-700">{children}</td>,
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt ?? ''} className="mb-5 h-auto w-full rounded-2xl" loading="lazy" />
          ),
          hr: () => <hr className="my-8 border-zinc-200" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
