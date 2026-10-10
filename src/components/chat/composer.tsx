"use client"
import { useEffect, useRef, useState } from "react"
import { Loader2, Plus, SlidersHorizontal } from "lucide-react"
import { FigmaIcon } from "@/components/figma-icon"

const categoryOptions = [{ tag: "acts", label: "Acts" }, { tag: "gazettes", label: "Gazettes" }, { tag: "circulars", label: "Circulars" }, { tag: "guidelines", label: "Guidelines" }]
interface Props { onSend: () => void; initialValue: string; onChange: (value: string) => void; isLoading?: boolean; selectedCategories?: string[]; onCategoriesChange?: (value: string[]) => void; selectedCountries?: string[]; onCountriesChange?: (value: string[]) => void; topK?: number; onTopKChange?: (value: number) => void }

export function ChatComposer({ onSend, initialValue, onChange, isLoading = false, selectedCategories = [], onCategoriesChange, selectedCountries = [], onCountriesChange, topK = 6, onTopKChange }: Props) {
  const [value, setValue] = useState(initialValue)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [country, setCountry] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { setValue(initialValue) }, [initialValue])
  const updateValue = (next: string) => { setValue(next); onChange(next) }
  const toggleCategory = (tag: string) => onCategoriesChange?.(selectedCategories.includes(tag) ? selectedCategories.filter((item) => item !== tag) : [...selectedCategories, tag])
  const addCountry = () => { const code = country.trim().toUpperCase(); if (/^[A-Z]{2}$/.test(code) && !selectedCountries.includes(code) && selectedCountries.length < 20) onCountriesChange?.([...selectedCountries, code]); setCountry("") }
  const filterCount = selectedCategories.length + selectedCountries.length

  return (
    <div className="shrink-0 px-3 pb-4 sm:px-6 sm:pb-6">
      <div className="focus-glow relative mx-auto max-w-[740px] rounded-[26px] border border-transparent bg-card px-[17px] pb-[14px] pt-[10px] shadow-[0_2px_10px_rgba(0,0,0,0.12)] dark:border-border">
        <textarea ref={textareaRef} value={value} onChange={(e) => updateValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (value.trim() && !isLoading) onSend() } }} placeholder="Ask about regulatory documents, obligations or guidance..." className="block max-h-48 min-h-[42px] w-full resize-none bg-transparent pt-[12px] text-sm leading-5 text-foreground outline-none placeholder:text-xs placeholder:font-medium placeholder:text-[#c4c4c4]" maxLength={4000} />
        {filtersOpen && <div className="tool-panel mb-3 mt-1 grid gap-4 p-3 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="mb-2 text-[11px] font-semibold text-muted-foreground">Source categories</p>
            <div className="flex flex-wrap gap-2">{categoryOptions.map((item) => <button type="button" key={item.tag} onClick={() => toggleCategory(item.tag)} aria-pressed={selectedCategories.includes(item.tag)} className="chip">{item.label}</button>)}</div>
            <p className="mb-2 mt-4 text-[11px] font-semibold text-muted-foreground">Jurisdictions</p>
            <div className="flex flex-wrap items-center gap-2">
              {selectedCountries.map((code) => <button type="button" key={code} onClick={() => onCountriesChange?.(selectedCountries.filter((item) => item !== code))} aria-pressed="true" className="chip min-w-0">{code} ×</button>)}
              <span className="flex"><input aria-label="ISO country code" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCountry() } }} placeholder="LK" className="h-[25px] w-12 rounded-l-full border border-input bg-card px-3 text-xs uppercase outline-none" /><button type="button" onClick={addCountry} className="h-[25px] rounded-r-full border border-l-0 border-input bg-card px-3 text-xs font-medium text-muted-foreground">Add</button></span>
            </div>
          </div>
          <label className="flex items-center gap-2 self-start text-xs font-medium text-muted-foreground">Top results<select value={topK} onChange={(e) => onTopKChange?.(Number(e.target.value))} className="h-[25px] rounded-full border border-input bg-card px-2 text-xs">{[4, 6, 8, 10, 12, 20].map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-[10px]">
            <button type="button" onClick={() => setFiltersOpen((open) => !open)} className="grid h-5 w-5 place-items-center text-foreground" aria-label={filtersOpen ? "Hide source filters" : "Add source filters"} aria-expanded={filtersOpen}><Plus className={`h-[14px] w-[14px] transition ${filtersOpen ? "rotate-45" : ""}`} strokeWidth={2.2} /></button>
            <button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} className={`flex h-[18px] items-center gap-2 rounded-full border px-2 text-[10px] font-medium transition ${filtersOpen || filterCount ? "border-sky-400 text-sky-600" : "border-[#eeeeee] text-[#999] dark:border-border"}`}><SlidersHorizontal className="h-[10px] w-[10px]" />Sources{filterCount > 0 && <span className="font-semibold">{filterCount}</span>}</button>
          </div>
          <div className="flex items-center gap-[15px]">
            <span className="text-[10px] font-medium text-[#999]">{value.length}/4000</span>
            <button type="button" onClick={onSend} disabled={!value.trim() || isLoading} className="grid h-[23px] w-[23px] place-items-center rounded-full transition enabled:hover:opacity-70 disabled:opacity-40" aria-label="Send question">{isLoading ? <Loader2 className="h-4 w-4 animate-spin text-sky-600" /> : <FigmaIcon name="send" className="dark:invert" />}</button>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-6 max-w-[740px] text-center text-xs font-medium text-muted-foreground">Answers are grounded in sources visible to your current identity. Verify critical conclusions against canonical citations.</p>
    </div>
  )
}
