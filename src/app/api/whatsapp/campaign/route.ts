import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, whatsappCampaignRecipients, whatsappCampaigns } from "@/db/schema";
import { requireApiSession } from "@/lib/api-auth";

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

type CampaignResult = { id: string; status: string; messageId?: string };

function getConfig() {
  const live = process.env.WHATSAPP_SEND_MODE === "live";
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
  return {
    mode: live && accessToken && phoneNumberId ? "live" as const : "simulation" as const,
    accessToken,
    phoneNumberId,
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION ?? "v23.0",
    pipelineTemplate: process.env.WHATSAPP_TEMPLATE_PIPELINE ?? "penawaran_suplesi",
    reminderTemplate: process.env.WHATSAPP_TEMPLATE_REMINDER ?? "pengingat_setoran",
  };
}

async function persistCampaign(campaignType: CampaignType, mode: "simulation" | "live", recipients: CampaignRecipient[], results: CampaignResult[], userId: string, branchCode: string) {
  const id = crypto.randomUUID();
  const now = new Date();
  const templateName = campaignType === "pipeline" ? getConfig().pipelineTemplate : getConfig().reminderTemplate;
  await db.insert(whatsappCampaigns).values({ id, campaignType, templateName, mode, status: results.some((item) => item.status === "Gagal") ? "Sebagian Gagal" : "Selesai", recipientCount: recipients.length, branchCode, createdBy: userId, createdAt: now });
  await db.insert(whatsappCampaignRecipients).values(recipients.map((recipient) => {
    const result = results.find((item) => item.id === recipient.id);
    return { id: crypto.randomUUID(), campaignId: id, accountNumber: recipient.accountNumber ?? recipient.id, name: recipient.name, phone: recipient.phone, status: result?.status ?? "Gagal", messageId: result?.messageId, createdAt: now };
  }));
  await db.insert(auditLogs).values({ id: crypto.randomUUID(), actorId: userId, action: "SEND_WHATSAPP_CAMPAIGN", entity: "whatsapp_campaign", entityId: id, detail: `${campaignType} | ${mode} | ${recipients.length} penerima`, branchCode, createdAt: now });
}

export async function GET(request: Request) {
  const authResult = await requireApiSession(request);
  if (authResult.response) return authResult.response;
  const config = getConfig();
  return NextResponse.json({ mode: config.mode });
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
  const recipients = payload.recipients.filter((item) => item.id && /^62\d{8,15}$/.test(item.phone));
  if (!recipients.length) {
    return NextResponse.json({ ok: false, message: "Tidak ada nomor WhatsApp yang valid." }, { status: 400 });
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
  const results = await Promise.all(recipients.map(async (recipient) => {
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
            language: { code: "id" },
            components: [{
              type: "body",
              parameters: parameters.map((text) => ({ type: "text", text })),
            }],
          },
        }),
      });
      const responsePayload = await response.json().catch(() => ({}));
      return { id: recipient.id, status: response.ok ? "Terkirim" : "Gagal", messageId: responsePayload.messages?.[0]?.id };
    } catch {
      return { id: recipient.id, status: "Gagal" };
    }
  }));

  const sent = results.filter((item) => item.status === "Terkirim").length;
  await persistCampaign(campaignType, "live", recipients, results, authResult.session.user.id, branchCode);
  return NextResponse.json({
    ok: sent > 0,
    mode: "live",
    message: `${sent} dari ${results.length} pesan berhasil diteruskan ke WhatsApp Cloud API.`,
    results,
  });
}
