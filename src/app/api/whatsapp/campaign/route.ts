import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, whatsappCampaignRecipients, whatsappCampaigns } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CampaignType = "pipeline" | "reminder";
type CampaignRecipient = {
  id: string;
  accountNumber?: string;
  phone: string;
  name: string;
  mantri: string;
  product?: string;
  dueDate?: string;
};

type CampaignResult = { id: string; status: string; messageId?: string; error?: string };

function normalizePhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return `62${digits}`;
}

function safeTemplateText(value: unknown, fallback = "-") {
  const text = String(value ?? "").trim();
  return (text || fallback).slice(0, 1024);
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, handler: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await handler(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

function getConfig() {
  const requestedMode = process.env.WHATSAPP_SEND_MODE === "live" ? "live" as const : "simulation" as const;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
  const missing = requestedMode === "live"
    ? [
        !accessToken ? "WHATSAPP_ACCESS_TOKEN" : "",
        !phoneNumberId ? "WHATSAPP_PHONE_NUMBER_ID" : "",
      ].filter(Boolean)
    : [];
  return {
    requestedMode,
    mode: requestedMode === "live" && !missing.length ? "live" as const : "simulation" as const,
    ready: requestedMode === "simulation" || !missing.length,
    missing,
    accessToken,
    phoneNumberId,
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION ?? "v23.0",
    pipelineTemplate: process.env.WHATSAPP_TEMPLATE_PIPELINE ?? "penawaran_suplesi",
    reminderTemplate: process.env.WHATSAPP_TEMPLATE_REMINDER ?? "pengingat_setoran",
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "id",
  };
}

async function persistCampaign(campaignType: CampaignType, mode: "simulation" | "live", recipients: CampaignRecipient[], results: CampaignResult[], userId: string, branchCode: string) {
  const id = crypto.randomUUID();
  const now = new Date();
  const templateName = campaignType === "pipeline" ? getConfig().pipelineTemplate : getConfig().reminderTemplate;
  const failedCount = results.filter((item) => item.status === "Gagal").length;
  const campaignStatus = failedCount === results.length ? "Gagal" : failedCount ? "Sebagian Gagal" : "Selesai";
  await db.insert(whatsappCampaigns).values({ id, campaignType, templateName, mode, status: campaignStatus, recipientCount: recipients.length, branchCode, createdBy: userId, createdAt: now });
  const resultById = new Map(results.map((item) => [item.id, item]));
  await db.insert(whatsappCampaignRecipients).values(recipients.map((recipient) => {
    const result = resultById.get(recipient.id);
    return { id: crypto.randomUUID(), campaignId: id, accountNumber: recipient.accountNumber ?? recipient.id, name: recipient.name, phone: recipient.phone, status: result?.status ?? "Gagal", messageId: result?.messageId, error: result?.error, createdAt: now };
  }));
  await db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: userId, action: "SEND_WHATSAPP_CAMPAIGN", entity: "whatsapp_campaign", entityId: id, detail: `${campaignType} | ${mode} | ${recipients.length} penerima`, branchCode, createdAt: now });
}

export async function GET(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  const config = getConfig();
  return NextResponse.json({
    mode: config.mode,
    requestedMode: config.requestedMode,
    ready: config.ready,
    missing: config.missing,
    graphVersion: config.graphVersion,
    templateLanguage: config.templateLanguage,
    templates: {
      pipeline: config.pipelineTemplate,
      reminder: config.reminderTemplate,
    },
  });
}

export async function POST(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  const branchCode = authResult.session.user.branchCode ?? "8014";
  const config = getConfig();
  const payload = await request.json().catch(() => null) as { campaignType?: CampaignType; recipients?: CampaignRecipient[] } | null;
  if (!payload || !["pipeline", "reminder"].includes(payload.campaignType ?? "") || !Array.isArray(payload.recipients) || !payload.recipients.length) {
    return NextResponse.json({ ok: false, message: "Data campaign tidak lengkap." }, { status: 400 });
  }

  const campaignType = payload.campaignType as CampaignType;
  const seenRecipientIds = new Set<string>();
  const recipients = payload.recipients
    .map((item) => ({
      ...item,
      id: safeTemplateText(item.id, ""),
      accountNumber: safeTemplateText(item.accountNumber, ""),
      phone: normalizePhone(item.phone),
      name: safeTemplateText(item.name, "Nasabah"),
      mantri: safeTemplateText(item.mantri, "BRI"),
      product: item.product ? safeTemplateText(item.product) : undefined,
      dueDate: item.dueDate ? safeTemplateText(item.dueDate) : undefined,
    }))
    .filter((item) => {
      if (!item.id || !/^62\d{8,13}$/.test(item.phone) || seenRecipientIds.has(item.id)) return false;
      seenRecipientIds.add(item.id);
      return true;
    });
  if (!recipients.length) {
    return NextResponse.json({ ok: false, message: "Tidak ada nomor WhatsApp yang valid." }, { status: 400 });
  }

  if (config.requestedMode === "live" && !config.ready) {
    return NextResponse.json({
      ok: false,
      mode: "simulation",
      message: `Mode live belum aktif. Lengkapi ${config.missing.join(" dan ")} pada environment server.`,
    }, { status: 503 });
  }

  if (config.mode === "simulation") {
    const results = recipients.map((item) => ({ id: item.id, status: "Simulasi Berhasil" }));
    await persistCampaign(campaignType, "simulation", recipients, results, authResult.session.user.id, branchCode);
    return NextResponse.json({
      ok: true,
      mode: "simulation",
      message: `Simulasi berhasil untuk ${recipients.length} nasabah. Tidak ada pesan nyata yang dikirim.`,
      results,
    });
  }

  const templateName = campaignType === "pipeline" ? config.pipelineTemplate : config.reminderTemplate;
  const results = await mapWithConcurrency(recipients, 8, async (recipient) => {
    const parameters = campaignType === "pipeline"
      ? [recipient.name, recipient.product ?? "pinjaman", recipient.mantri]
      : [recipient.name, recipient.dueDate ?? "-", recipient.mantri];
    try {
      const response = await fetch(`https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient.phone,
          type: "template",
          template: {
            name: templateName,
            language: { code: config.templateLanguage },
            components: [{
              type: "body",
              parameters: parameters.map((text) => ({ type: "text", text })),
            }],
          },
        }),
      });
      const responsePayload = await response.json().catch(() => ({}));
      const apiError = responsePayload.error;
      return {
        id: recipient.id,
        status: response.ok ? "Diterima Meta" : "Gagal",
        messageId: responsePayload.messages?.[0]?.id,
        error: response.ok ? undefined : safeTemplateText(apiError?.message ?? `Meta API HTTP ${response.status}`),
      };
    } catch (error) {
      return { id: recipient.id, status: "Gagal", error: error instanceof Error ? safeTemplateText(error.message) : "Koneksi ke Meta gagal." };
    }
  });

  const sent = results.filter((item) => item.status === "Diterima Meta").length;
  await persistCampaign(campaignType, "live", recipients, results, authResult.session.user.id, branchCode);
  return NextResponse.json({
    ok: sent > 0,
    mode: "live",
    message: `${sent} dari ${results.length} pesan diterima WhatsApp Cloud API untuk diproses.`,
    results,
  });
}
