import ReactMarkdown from "react-markdown"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer" className="text-sky-600 dark:text-sky-300 underline decoration-sky-400/30 underline-offset-4 hover:text-sky-700 dark:text-sky-200">{children}</a>,
        h2: ({ children }) => <h2 className="mb-3 mt-6 text-lg font-semibold text-foreground first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-2 mt-5 font-semibold text-foreground">{children}</h3>,
        p: ({ children }) => <p className="my-3 leading-7 text-foreground/80 first:mt-0 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="my-3 list-disc space-y-1.5 pl-5 text-foreground/80 marker:text-sky-400">{children}</ul>,
        ol: ({ children }) => <ol className="my-3 list-decimal space-y-1.5 pl-5 text-foreground/80 marker:text-sky-400">{children}</ol>,
        table: ({ children }) => <div className="my-4 overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[520px] text-left text-sm">{children}</table></div>,
        th: ({ children }) => <th className="bg-foreground/[0.05] px-3 py-2 font-medium text-foreground/90">{children}</th>,
        td: ({ children }) => <td className="border-t border-border px-3 py-2 text-muted-foreground">{children}</td>,
        code: ({ children }) => <code className="rounded-md bg-background/70 px-1.5 py-0.5 font-mono text-[0.9em] text-sky-700 dark:text-sky-200">{children}</code>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
