import { toast } from "@/hooks/use-toast"

const NOTICE_KEY = "pfmnext_access_notice"
const notices = {
  expired: { title: "Your session has expired", description: "Sign in again to open the admin console." },
  forbidden: { title: "Administrator access required", description: "Your account cannot open that page, so you were returned to the assistant." },
}

// Admin pages call this for every backend response. When the backend refuses the caller (signed out,
// session expired, or not an administrator) the browser goes to the assistant, which explains why.
// Resolves to false when the response is not an access refusal; otherwise it never resolves, so the
// page does not render an error while the browser is leaving.
export async function leaveIfAccessDenied(response: Response): Promise<boolean> {
  if (typeof window === "undefined" || !window.location.pathname.startsWith("/admin")) return false
  if (response.status !== 401 && response.status !== 403) return false
  const session = await fetch("/api/auth/session", { cache: "no-store" }).then((result) => result.ok).catch(() => false)
  try { window.sessionStorage.setItem(NOTICE_KEY, session ? "forbidden" : "expired") } catch { /* storage blocked: redirect without the message */ }
  window.location.replace("/chat")
  return new Promise<boolean>(() => {})
}

export function showAccessNotice(): void {
  let reason: string | null = null
  try { reason = window.sessionStorage.getItem(NOTICE_KEY); window.sessionStorage.removeItem(NOTICE_KEY) } catch { return }
  if (reason === "expired" || reason === "forbidden") toast(notices[reason])
}
