// Re-mounts on every admin navigation, so each page's content eases in (sidebar and header stay put).
export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>
}
