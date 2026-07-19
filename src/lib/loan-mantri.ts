export function hasLoanMantri(value: unknown) {
  const normalized = String(value ?? "").trim();
  return Boolean(normalized && normalized !== "-");
}
