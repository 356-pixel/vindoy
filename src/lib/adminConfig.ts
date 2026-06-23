// Vindoy admin & branding config.
// Change ADMIN_PASSWORD to whatever you want. The login at /admin checks against this value.
// (Client-side gate — keep this password to yourself. For stronger security, move to a server-checked rule later.)

export const SHAREABLE_DOMAIN = "https://vindoy.com";
export const ADMIN_PASSWORD = "vindoy2026"; // <- change me

// Admin-issued tracking IDs. Only IDs in this list are accepted by the
// shortener and tracked in the analytics pipeline. Anything else is ignored.
// Add new IDs here as you issue them.
export const ALLOWED_TRACKING_IDS = ["PML"] as const;

// Admin dashboard: hide tracking IDs / links with fewer than this many clicks.
// Does NOT affect Today/Week/Month summary totals.
export const MIN_CLICKS_DISPLAY = 25;

// Curated list of supported countries for per-country article overrides.
// "ALL" is the implicit default and is not in this list.
// Priority countries shown first in the admin (in this exact order).
export const PRIORITY_COUNTRY_CODES = [
  "PH", "ID", "KH", "TH", "VN", "MX", "MY", "IN", "BD", "US",
  "BR", "TW", "SG", "SA", "KR", "CA", "JP",
  "GB", "PK", "AU", "IT", "FR", "ES", "HK", "DE", "AE", "NG",
];

const ALL_COUNTRIES: { code: string; name: string; flag: string }[] = [
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "KR", name: "Korea, Republic of", flag: "🇰🇷" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  // Rest of the world (alphabetical)
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
];

export const COUNTRIES = ALL_COUNTRIES;

export function countryName(code: string) {
  if (code === "ALL") return "Default (all countries)";
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
