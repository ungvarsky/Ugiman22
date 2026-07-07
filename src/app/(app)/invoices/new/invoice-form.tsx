"use client";

import { useActionState } from "react";
import { createInvoice, type InvoiceFormState } from "@/lib/actions/invoices";

const initialState: InvoiceFormState = {};

export function NewInvoiceForm() {
  const [state, formAction, pending] = useActionState(createInvoice, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Invoice number" name="invoiceNumber" error={state?.fieldErrors?.invoiceNumber}>
          <input name="invoiceNumber" required className="input" />
        </Field>
        <Field label="Vendor" name="vendorName" error={state?.fieldErrors?.vendorName}>
          <input name="vendorName" required className="input" />
        </Field>
        <Field label="Amount" name="amount" error={state?.fieldErrors?.amount}>
          <input name="amount" type="number" step="0.01" min="0.01" required className="input" />
        </Field>
        <Field label="Currency" name="currency" error={state?.fieldErrors?.currency}>
          <select name="currency" defaultValue="EUR" className="input">
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="CZK">CZK</option>
          </select>
        </Field>
        <Field label="Issue date" name="issueDate" error={state?.fieldErrors?.issueDate}>
          <input name="issueDate" type="date" required className="input" />
        </Field>
        <Field label="Due date (optional)" name="dueDate">
          <input name="dueDate" type="date" className="input" />
        </Field>
      </div>
      <Field label="Description (optional)" name="description">
        <textarea name="description" rows={3} className="input" />
      </Field>
      <Field label="Attachment (PDF, PNG, JPG — optional)" name="attachment">
        <input name="attachment" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="input" />
      </Field>

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
