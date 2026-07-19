import assert from "node:assert/strict";
import test from "node:test";
import { hasBrimenGuarantee, hasBrimenGuaranteeDetail, hasBrimenGuaranteeReference } from "../src/lib/brimen-guarantee";

test("nilai tanpa jaminan tidak dianggap sebagai jaminan", () => {
  assert.equal(hasBrimenGuarantee({ brimenJaminan: "-", guarantee: "Tanpa Jaminan" }), false);
  assert.equal(hasBrimenGuarantee({ brimenJaminan: "-", guarantee: "KUR tanpa jaminan" }), false);
  assert.equal(hasBrimenGuarantee({ brimenJaminan: "I.A.1.1", guarantee: "Tidak ada detail jaminan" }), false);
});

test("nomor dan detail jaminan harus tersedia", () => {
  assert.equal(hasBrimenGuarantee({ brimenJaminan: "", guarantee: "BPKB kendaraan" }), false);
  assert.equal(hasBrimenGuarantee({ brimenJaminan: "I.A.1.1", guarantee: "BPKB kendaraan" }), true);
});

test("detail jaminan tanpa nomor tetap ditandai belum lengkap", () => {
  assert.equal(hasBrimenGuaranteeDetail({ guarantee: "SHM No. 123" }), true);
  assert.equal(hasBrimenGuaranteeReference("-"), false);
});
