"use server";

import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { requireSession } from "@/lib/session";

export type CompanyLookupResult = {
  name: string;
  ico: string;
  dic?: string;
  icDph?: string;
  address?: string;
};

/** Finds an identifier value in RPO's `identifiers` array by matching its `type` against a keyword. */
function findIdentifier(
  identifiers: Array<{ value?: string; type?: string }> | undefined,
  keyword: string
): string | undefined {
  return identifiers?.find((i) => i.type?.toLowerCase().includes(keyword))?.value;
}

/**
 * Looks up a company by IČO in the Slovak public business register (RPO,
 * run by the Statistical Office). This sandbox has no outbound access to
 * verify the exact response shape live, so the parser tries several known
 * field-name variants and fails gracefully (returns null) if none match —
 * treat this as needing a real-world smoke test after deployment.
 */
export async function lookupCompanyByIco(ico: string): Promise<CompanyLookupResult | null> {
  await requireSession();

  if (!/^\d{8}$/.test(ico)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const rpoBaseUrl = process.env.RPO_API_BASE_URL ?? "https://api.statistics.sk";
    const res = await fetch(
      `${rpoBaseUrl}/rpo/v1/search?identifiers=${ico}`,
      { signal: controller.signal, headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const entity = data?.results?.[0] ?? data?.[0];
    if (!entity) return null;

    const name: string | undefined =
      entity.fullNames?.[0]?.value ??
      entity.fullName?.value ??
      entity.name ??
      entity.businessName ??
      entity.organizationName;

    if (!name) return null;

    const addressEntry = entity.addresses?.[0]?.value ?? entity.address;
    const address: string | undefined =
      addressEntry?.formatted ??
      addressEntry?.formattedAddress ??
      (typeof addressEntry === "string" ? addressEntry : undefined);

    const dic = findIdentifier(entity.identifiers, "dic") ?? entity.dic;
    const icDph =
      findIdentifier(entity.identifiers, "dph") ?? entity.icDph ?? entity.ic_dph;

    return { name, ico, dic, icDph, address };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function isOcrEnabled(): Promise<boolean> {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const ocrResultSchema = z.object({
  vendorName: z.string().trim().min(1).optional(),
  vendorIco: z.string().trim().min(1).optional(),
  vendorDic: z.string().trim().min(1).optional(),
  vendorIcDph: z.string().trim().min(1).optional(),
  vendorAddress: z.string().trim().min(1).optional(),
  invoiceNumber: z.string().trim().min(1).optional(),
  // Refund/return receipts print a negative total; take the magnitude since
  // the invoice form itself only accepts positive amounts.
  amount: z.coerce.number().refine((n) => n !== 0).transform(Math.abs).optional(),
  currency: z.string().trim().min(1).optional(),
  issueDate: z.string().trim().min(1).optional(),
});

export type OcrExtractedInvoice = z.infer<typeof ocrResultSchema>;
export type OcrResult = { data: OcrExtractedInvoice } | { error: string };

const OCR_ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function extractInvoiceFromImage(
  base64: string,
  mediaType: string
): Promise<OcrResult> {
  await requireSession();

  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "OCR nie je nakonfigurované (chýba ANTHROPIC_API_KEY)." };
  }
  if (!OCR_ALLOWED_MEDIA_TYPES.has(mediaType)) {
    return { error: "OCR funguje len pre fotky (JPG, PNG, WEBP), nie pre PDF." };
  }

  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseURL: process.env.ANTHROPIC_BASE_URL,
    });
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data: base64,
              },
            },
            {
              type: "text",
              text: [
                "Toto je faktúra alebo pokladničný doklad, možno v slovenčine.",
                "Vráť IBA jeden JSON objekt (žiadny iný text, žiadne markdown bloky) s týmito poľami,",
                "vynechaj polia, ktoré na obrázku nevieš s istotou nájsť:",
                '{"vendorName": string, "vendorIco": string, "vendorDic": string, "vendorIcDph": string, "vendorAddress": string, "invoiceNumber": string, "amount": number, "currency": "EUR"|"USD"|"CZK", "issueDate": "YYYY-MM-DD"}',
                "vendorIco je IČO dodávateľa (8-miestne číslo), vendorDic je DIČ, vendorIcDph je IČ DPH",
                "(zvyčajne v tvare SK + 10 číslic, ak je uvedené), vendorAddress je celá adresa dodávateľa ako jeden text.",
                "amount je celková suma dokladu bez symbolu meny, vždy ako kladné číslo",
                "(aj keby bola na doklade uvedená ako záporná, napr. pri dobropise/vrátení tovaru).",
              ].join(" "),
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { error: "AI nevrátila čitateľnú odpoveď. Skús to znova." };
    }

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { error: "Nepodarilo sa rozpoznať dáta na obrázku." };
    }

    const parsed = ocrResultSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!parsed.success) {
      return { error: "Rozpoznané dáta majú neočakávaný formát." };
    }

    return { data: parsed.data };
  } catch (err) {
    console.error("OCR extraction failed:", err);
    return { error: "Spracovanie obrázka zlyhalo. Skús to znova alebo vyplň polia ručne." };
  }
}
