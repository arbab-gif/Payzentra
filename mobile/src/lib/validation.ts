export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export const PASSWORD_RULES = [
  { id: "len", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "case", label: "Upper and lower case letters", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: "num", label: "At least one number", test: (p: string) => /\d/.test(p) },
  { id: "sym", label: "At least one symbol (e.g. ! @ #)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export const passwordOk = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

/** Nigerian mobile number without the leading 0, e.g. 8031234567. */
/** Letters (any script), spaces, hyphens and apostrophes; 2–50 characters. */
export const isName = (v: string) => /^[\p{L}][\p{L}' -]{1,49}$/u.test(v.trim());
export const normalisePhone = (v: string) => v.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "");
export const isNgPhone = (v: string) => /^[789][01]\d{8}$/.test(normalisePhone(v));

export function ageFrom(dob: string) {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return -1;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export const NG_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River",
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna",
  "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

/** True when an ISO date (YYYY-MM-DD) exists on the calendar, e.g. rejects 31/02. */
export function isRealDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
