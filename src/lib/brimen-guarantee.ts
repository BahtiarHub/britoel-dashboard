export type BrimenGuaranteeFields = {
  brimenJaminan?: string | null;
  guarantee?: string | null;
};

const emptyGuaranteeMarkers = new Set(["", "-", "n/a", "na", "null", "none"]);
const noGuaranteePatterns = [
  /\btanpa jaminan\b/,
  /\btidak ada(?: [a-z]+){0,3} jaminan\b/,
  /\btidak memiliki jaminan\b/,
  /\bjaminan tidak ada\b/,
  /\bno collateral\b/,
];

function normalizeGuaranteeValue(value?: string | null) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function isNoGuaranteeValue(value?: string | null) {
  const normalized = normalizeGuaranteeValue(value);
  return emptyGuaranteeMarkers.has(normalized) || noGuaranteePatterns.some((pattern) => pattern.test(normalized));
}

export function hasBrimenGuaranteeDetail(row: Pick<BrimenGuaranteeFields, "guarantee">) {
  return !isNoGuaranteeValue(row.guarantee);
}

export function hasBrimenGuaranteeReference(value?: string | null) {
  return !isNoGuaranteeValue(value);
}

export function hasBrimenGuarantee(row: BrimenGuaranteeFields) {
  return hasBrimenGuaranteeDetail(row) && hasBrimenGuaranteeReference(row.brimenJaminan);
}
