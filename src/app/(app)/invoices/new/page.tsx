import { NewInvoiceForm } from "./invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-lg font-semibold text-slate-900">New Invoice</h1>
      <p className="mb-6 text-sm text-slate-500">
        Submitting an invoice automatically routes it to the correct approvers based on its amount.
      </p>
      <NewInvoiceForm />
    </div>
  );
}
