"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { createInvoice, type InvoiceFormState } from "@/lib/actions/invoices";
import { lookupCompanyByIco, extractInvoiceFromImage } from "@/lib/actions/enrichment";
import { decodeQrFromImageFile, extractIcoCandidates, fileToBase64 } from "@/lib/qr-scan";

const initialState: InvoiceFormState = {};

type QrState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "found"; ico: string; companyName: string }
  | { status: "not_found" };

type OcrState = { status: "idle" | "loading" | "done" } | { status: "error"; message: string };

export function NewInvoiceForm({ ocrEnabled }: { ocrEnabled: boolean }) {
  const [state, formAction, pending] = useActionState(createInvoice, initialState);
  const [qrState, setQrState] = useState<QrState>({ status: "idle" });
  const [ocrState, setOcrState] = useState<OcrState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const invoiceNumberRef = useRef<HTMLInputElement>(null);
  const vendorNameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const currencyRef = useRef<HTMLSelectElement>(null);
  const issueDateRef = useRef<HTMLInputElement>(null);

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
        setQrState({ status: "not_found" });
        return;
      }
      const icoCandidates = extractIcoCandidates(qrText);
      for (const ico of icoCandidates) {
        const company = await lookupCompanyByIco(ico);
        if (company) {
          setQrState({ status: "found", ico, companyName: company.name });
          if (vendorNameRef.current && !vendorNameRef.current.value) {
            vendorNameRef.current.value = company.name;
          }
          return;
        }
      }
      setQrState({ status: "not_found" });
    } catch {
      setQrState({ status: "not_found" });
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
        if (data.amount && amountRef.current) amountRef.current.value = String(data.amount);
        if (data.currency && currencyRef.current) currencyRef.current.value = data.currency;
        if (data.issueDate && issueDateRef.current) issueDateRef.current.value = data.issueDate;
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
        <textarea name="description" rows={3} className="input" />
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
      {qrState.status === "not_found" && (
        <p className="text-xs text-slate-400">Na fotke sa nenašiel čitateľný QR kód s IČO firmy vo verejnom registri.</p>
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
