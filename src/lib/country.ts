// Detects the visitor's country via ipapi.co, cached in sessionStorage.
const KEY = "vindoy_country_v1";

export async function detectCountry(): Promise<string> {
  try {
    const cached = sessionStorage.getItem(KEY);
    if (cached) return cached;
  } catch {
    // ignore
  }
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) throw new Error("geo failed");
    const data = await res.json();
    const code = (data?.country_code || data?.country || "").toString().toUpperCase();
    if (code) {
      try {
        sessionStorage.setItem(KEY, code);
      } catch {
        // ignore
      }
      return code;
    }
  } catch {
    // ignore
  }
  return "";
}
