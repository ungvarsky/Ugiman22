"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { createInvoice, type InvoiceFormState } from "@/lib/actions/invoices";
import {
  lookupCompanyByIco,
  extractInvoiceFromImage,
  type OcrExtractedInvoice,
} from "@/lib/actions/enrichment";
import { decodeQrFromImageFile, extractIcoCandidates, fileToBase64 } from "@/lib/qr-scan";

const initialState: InvoiceFormState = {};

type QrState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "found"; ico: string; companyName: string }
  | { status: "no_qr" }
  | { status: "qr_no_ico" }
  | { status: "ico_no_match"; ico: string };

type OcrState = { status: "idle" | "loading" | "done" } | { status: "error"; message: string };

export function NewInvoiceForm({ ocrEnabled }: { ocrEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(createInvoice, initialState);
  const [qrState, setQrState] = useState<QrState>({ status: "idle" });
  const [ocrState, setOcrState] = useState<OcrState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const invoiceNumberRef = useRef<HTMLInputElement>(null);
  const vendorNameRef = useRef<HTMLInputElement>(null);
  const vendorIcoRef = useRef<HTMLInputElement>(null);
  const vendorDicRef = useRef<HTMLInputElement>(null);
  const vendorIcDphRef = useRef<HTMLInputElement>(null);
  const vendorAddressRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const currencyRef = useRef<HTMLSelectElement>(null);
  const issueDateRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setQrState({ status: "idle" });
    setOcrState({ status: "idle" });

    if (!file || !file.type.startsWith("image/")) return;

    setQrState({ status: "scanning" });
    try {
      const qrText = await decodeQrFromImageFile(file);
      if (!qrText) {
        setQrState({ status: "no_qr" });
        return;
      }
      const icoCandidates = extractIcoCandidates(qrText);
      if (icoCandidates.length === 0) {
        setQrState({ status: "qr_no_ico" });
        return;
      }
      for (const ico of icoCandidates) {
        const company = await lookupCompanyByIco(ico);
        if (company) {
          setQrState({ status: "found", ico, companyName: company.name });
          if (vendorNameRef.current && !vendorNameRef.current.value) {
            vendorNameRef.current.value = company.name;
          }
          if (vendorIcoRef.current && !vendorIcoRef.current.value) {
            vendorIcoRef.current.value = company.ico;
          }
          if (company.dic && vendorDicRef.current && !vendorDicRef.current.value) {
            vendorDicRef.current.value = company.dic;
          }
          if (company.icDph && vendorIcDphRef.current && !vendorIcDphRef.current.value) {
            vendorIcDphRef.current.value = company.icDph;
          }
          if (company.address && vendorAddressRef.current && !vendorAddressRef.current.value) {
            vendorAddressRef.current.value = company.address;
          }
          return;
        }
      }
      setQrState({ status: "ico_no_match", ico: icoCandidates[0] });
      if (vendorIcoRef.current && !vendorIcoRef.current.value) {
        vendorIcoRef.current.value = icoCandidates[0];
      }
    } catch {
      setQrState({ status: "no_qr" });
    }
  }

  function handleOcrClick() {
    if (!selectedFile) return;
    setOcrState({ status: "loading" });
    startTransition(async () => {
      try {
        const base64 = await fileToBase64(selectedFile);
        const result = await extractInvoiceFromImage(base64, selectedFile.type);
        if ("error" in result) {
          setOcrState({ status: "error", message: result.error });
          return;
        }
        const { data } = result;
        if (data.invoiceNumber && invoiceNumberRef.current) invoiceNumberRef.current.value = data.invoiceNumber;
        if (data.vendorName && vendorNameRef.current) vendorNameRef.current.value = data.vendorName;
        if (data.vendorIco && vendorIcoRef.current) vendorIcoRef.current.value = data.vendorIco;
        if (data.vendorDic && vendorDicRef.current) vendorDicRef.current.value = data.vendorDic;
        if (data.vendorIcDph && vendorIcDphRef.current) vendorIcDphRef.current.value = data.vendorIcDph;
        if (data.vendorAddress && vendorAddressRef.current) vendorAddressRef.current.value = data.vendorAddress;
        if (data.amount && amountRef.current) amountRef.current.value = String(data.amount);
        if (data.currency && currencyRef.current) currencyRef.current.value = data.currency;
        if (data.issueDate && issueDateRef.current) issueDateRef.current.value = data.issueDate;
        const details = formatItemsAndVat(data.items, data.vatBreakdown);
        if (details && descriptionRef.current && !descriptionRef.current.value) {
          descriptionRef.current.value = details;
        }
        setOcrState({ status: "done" });
      } catch {
        setOcrState({ status: "error", message: "Spracovanie obrázka zlyhalo." });
      }
    });
  }

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Invoice number" name="invoiceNumber" error={state?.fieldErrors?.invoiceNumber}>
          <input ref={invoiceNumberRef} name="invoiceNumber" required className="input" />
        </Field>
        <Field label="Vendor" name="vendorName" error={state?.fieldErrors?.vendorName}>
          <input ref={vendorNameRef} name="vendorName" required className="input" />
        </Field>
        <Field label="IČO (optional)" name="vendorIco">
          <input ref={vendorIcoRef} name="vendorIco" className="input" />
        </Field>
        <Field label="DIČ (optional)" name="vendorDic">
          <input ref={vendorDicRef} name="vendorDic" className="input" />
        </Field>
        <Field label="IČ DPH (optional)" name="vendorIcDph">
          <input ref={vendorIcDphRef} name="vendorIcDph" className="input" />
        </Field>
        <Field label="Adresa dodávateľa (optional)" name="vendorAddress">
          <input ref={vendorAddressRef} name="vendorAddress" className="input" />
        </Field>
        <Field label="Amount" name="amount" error={state?.fieldErrors?.amount}>
          <input ref={amountRef} name="amount" type="number" step="0.01" min="0.01" required className="input" />
        </Field>
        <Field label="Currency" name="currency" error={state?.fieldErrors?.currency}>
          <select ref={currencyRef} name="currency" defaultValue="EUR" className="input">
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="CZK">CZK</option>
          </select>
        </Field>
        <Field label="Issue date" name="issueDate" error={state?.fieldErrors?.issueDate}>
          <input ref={issueDateRef} name="issueDate" type="date" required className="input" />
        </Field>
        <Field label="Due date (optional)" name="dueDate">
          <input name="dueDate" type="date" className="input" />
        </Field>
      </div>
      <Field label="Description (optional)" name="description">
        <textarea ref={descriptionRef} name="description" rows={3} className="input" />
      </Field>
      <Field label="Attachment (PDF, PNG, JPG — optional)" name="attachment">
        <input
          name="attachment"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          className="input"
          onChange={handleFileChange}
        />
      </Field>

      {qrState.status === "scanning" && (
        <p className="text-xs text-slate-500">🔍 Hľadám QR kód na fotke...</p>
      )}
      {qrState.status === "found" && (
        <p className="text-xs text-green-700">
          ✅ Našiel som QR kód (IČO {qrState.ico}) — dodávateľ: <strong>{qrState.companyName}</strong> (doplnené z verejného registra)
        </p>
      )}
      {qrState.status === "no_qr" && (
        <p className="text-xs text-slate-400">Na fotke sa nenašiel žiadny čitateľný QR kód.</p>
      )}
      {qrState.status === "qr_no_ico" && (
        <p className="text-xs text-slate-400">Našiel som QR kód, ale nepodarilo sa z neho vytiahnuť IČO firmy.</p>
      )}
      {qrState.status === "ico_no_match" && (
        <p className="text-xs text-slate-400">
          Našiel som QR kód (IČO {qrState.ico}) — doplnil som IČO, ale firmu sa nepodarilo dohľadať vo verejnom registri, ostatné polia doplň ručne.
        </p>
      )}

      {ocrEnabled && selectedFile?.type.startsWith("image/") && (
        <div className="rounded-md border border-dashed border-blue-300 bg-blue-50 p-3">
          <button
            type="button"
            onClick={handleOcrClick}
            disabled={ocrState.status === "loading" || isPending}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {ocrState.status === "loading" ? "Čítam faktúru cez AI..." : "🤖 Vyplniť polia z fotky pomocou AI"}
          </button>
          {ocrState.status === "done" && (
            <p className="mt-2 text-xs text-green-700">✅ Polia boli doplnené — skontroluj ich pred odoslaním.</p>
          )}
          {ocrState.status === "error" && (
            <p className="mt-2 text-xs text-red-600">{ocrState.message}</p>
          )}
        </div>
      )}
      {!ocrEnabled && selectedFile?.type.startsWith("image/") && (
        <p className="text-xs text-slate-400">
          Tip: automatické vyplnenie polí z fotky cez AI je vypnuté, kým nie je nastavený ANTHROPIC_API_KEY.
        </p>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit for approval"}
      </button>
    </form>
  );
}

function formatItemsAndVat(
  items: OcrExtractedInvoice["items"],
  vatBreakdown: OcrExtractedInvoice["vatBreakdown"]
): string | null {
  const parts: string[] = [];

  if (items?.length) {
    parts.push("Položky:");
    for (const item of items) {
      const qty = item.quantity ?? 1;
      const unit = item.unitPrice !== undefined ? ` × ${item.unitPrice}` : "";
      const total = item.totalPrice !== undefined ? ` = ${item.totalPrice}` : "";
      parts.push(`- ${item.name}: ${qty} ks${unit}${total}`);
    }
  }

  if (vatBreakdown?.length) {
    if (parts.length) parts.push("");
    parts.push("DPH:");
    for (const line of vatBreakdown) {
      const rate = line.ratePercent !== undefined ? `${line.ratePercent}%` : "?%";
      const base = line.base !== undefined ? `, základ ${line.base}` : "";
      const vat = line.vat !== undefined ? `, DPH ${line.vat}` : "";
      parts.push(`- ${rate}${base}${vat}`);
    }
  }

  return parts.length ? parts.join("\n") : null;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
