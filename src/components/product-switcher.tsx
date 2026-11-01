"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, Check, LayoutGrid } from "lucide-react"
import { CURRENT_PRODUCT, PRODUCTS, PRODUCT_KEYS, type ProductKey } from "@/lib/products"

// Top-bar menu to open the other PFMNext products in a new tab. Lists the products the signed-in
// user may use (all of them for sessions created before products were recorded).
export function ProductSwitcher({ products }: { products?: ProductKey[] }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const available = PRODUCT_KEYS.filter((key) => key === CURRENT_PRODUCT || !products || products.includes(key))

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false) }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey) }
  }, [open])

  return <div ref={rootRef} className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" aria-label="PFMNext products" title="PFMNext products"
      className={`group flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition duration-200 active:scale-95 ${open ? "border-sky-400 bg-sky-400 text-white" : "border-border text-foreground hover:border-sky-400/60 hover:text-sky-600"}`}>
      <LayoutGrid className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? "rotate-90" : "group-hover:rotate-90"}`} />
      <span className="hidden sm:inline">Products</span>
    </button>
    {open && <div role="menu" className="animate-pop-in absolute right-0 top-[calc(100%+8px)] z-50 w-[280px] rounded-[14px] border border-border bg-popover p-2 text-popover-foreground shadow-[0_18px_40px_-20px_hsl(var(--brand-ink)/0.45)]">
      <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">PFMNext products</p>
      <div className="stagger-in grid gap-1">
        {available.map((key) => {
          const product = PRODUCTS[key]
          const current = key === CURRENT_PRODUCT
          const body = <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.logo} alt="" className="h-8 w-8 shrink-0 object-contain transition-transform duration-300 group-hover:scale-110" />
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-sky-600">{product.name}</span><span className="block text-[11px] leading-[14px] text-muted-foreground">{product.description}</span></span>
            {current ? <Check className="h-4 w-4 text-emerald-600" aria-label="You are here" /> : <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-sky-600" />}
          </>
          return current
            ? <div key={key} className="flex items-center gap-3 rounded-[10px] bg-[hsl(var(--surface))] px-2.5 py-2" aria-current="true">{body}</div>
            : <a key={key} role="menuitem" href={`/api/products/${key}`} target="_blank" rel="noopener" onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-[10px] px-2.5 py-2 transition hover:bg-sky-400/[0.07]">{body}</a>
        })}
      </div>
      <a role="menuitem" href="/api/products/all" target="_blank" rel="noopener" onClick={() => setOpen(false)} className="group mt-1 flex items-center justify-between rounded-[10px] border-t border-border px-2.5 pb-1.5 pt-2.5 text-xs font-medium text-muted-foreground transition hover:text-sky-600">
        All products<ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </a>
    </div>}
  </div>
}
