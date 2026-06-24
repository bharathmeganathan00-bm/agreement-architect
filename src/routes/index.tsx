import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AGZUS Client Agreement Generator" },
      { name: "description", content: "Fill in client and project details and download the completed AGZUS Client Service Agreement PDF." },
    ],
  }),
  component: AgreementMaker,
});

type FormState = {
  agreementDate: string;
  clientName: string;
  companyName: string;
  contactNo: string;
  email: string;
  address: string;
  projectType: string;
  pagesModules: string;
  mainFeatures: string;
  technology: string;
  adminPanel: "Yes" | "No";
  mobileResponsive: "Yes" | "No";
  paymentGateway: "Yes" | "No";
  whatsappSmsEmail: "Yes" | "No";
  hostingDomain: "Yes" | "No";
  projectDuration: string;
  totalCost: string;
  advancePayment: string;
  advancePercent: string;
  secondPayment: string;
  secondPercent: string;
  finalPayment: string;
  finalPercent: string;
  monthlySubscription: string;
  renewalDate: string;
  subscriptionPlan: string;
  revisionRounds: string;
  freeSupportDays: string;
  spName: string;
  spDesignation: string;
  spDate: string;
  clientDesignation: string;
  clientDate: string;
};

const initial: FormState = {
  agreementDate: "",
  clientName: "",
  companyName: "",
  contactNo: "",
  email: "",
  address: "",
  projectType: "",
  pagesModules: "",
  mainFeatures: "",
  technology: "",
  adminPanel: "Yes",
  mobileResponsive: "Yes",
  paymentGateway: "No",
  whatsappSmsEmail: "No",
  hostingDomain: "No",
  projectDuration: "",
  totalCost: "",
  advancePayment: "",
  advancePercent: "",
  secondPayment: "",
  secondPercent: "",
  finalPayment: "",
  finalPercent: "",
  monthlySubscription: "",
  renewalDate: "",
  subscriptionPlan: "",
  revisionRounds: "",
  freeSupportDays: "",
  spName: "",
  spDesignation: "",
  spDate: "",
  clientDesignation: "",
  clientDate: "",
};

// Page height for all pages (A4-ish): 842.25
const PH = 842.25;
// helper: convert top-down y to pdf-lib bottom-up
const Y = (top: number) => PH - top;

function AgreementMaker() {
  const [form, setForm] = useState<FormState>(initial);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/templates/agzus-client-service-agreement.pdf");
      if (!res.ok) throw new Error("Could not load PDF template");
      const bytes = await res.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const pages = pdf.getPages();
      const black = rgb(0.05, 0.05, 0.05);

      const draw = (
        pageIdx: number,
        text: string,
        x: number,
        topY: number,
        size = 10,
        bold = false,
      ) => {
        if (!text) return;
        pages[pageIdx].drawText(text, {
          x,
          y: Y(topY) - size * 0.2,
          size,
          font: bold ? fontBold : font,
          color: black,
        });
      };

      // PAGE 1 — Agreement date (between "made on" and "between")
      draw(0, form.agreementDate, 175, 204, 10);

      // Client details (right column)
      draw(0, form.clientName, 405, 279);
      draw(0, form.companyName, 405, 299);
      draw(0, form.contactNo, 405, 319);
      draw(0, form.email, 405, 339);
      draw(0, form.address, 405, 359);

      // PAGE 2 — Project Scope (left column values)
      draw(1, form.projectType, 165, 386);
      draw(1, form.pagesModules, 165, 409);
      draw(1, form.mainFeatures, 165, 432);
      draw(1, form.technology, 165, 455);

      // Yes/No selections (right column) — strike through the opposite by drawing a line
      const yesNo = (pageIdx: number, top: number, value: "Yes" | "No") => {
        // The label area "Yes / No" sits around x=425-470 on right column
        // Draw a checkmark "✓" next to the chosen word by overlaying.
        const p = pages[pageIdx];
        const yesX = 432;
        const noX = 460;
        const y = Y(top) - 1;
        const chosenX = value === "Yes" ? yesX : noX;
        const otherX = value === "Yes" ? noX : yesX;
        const otherW = value === "Yes" ? 14 : 18;
        // strike-through the non-selected
        p.drawLine({
          start: { x: otherX - 2, y: y + 3 },
          end: { x: otherX + otherW, y: y + 3 },
          thickness: 1,
          color: black,
        });
        // underline the selected
        p.drawLine({
          start: { x: chosenX - 2, y: y - 2 },
          end: { x: chosenX + (value === "Yes" ? 14 : 18), y: y - 2 },
          thickness: 1.2,
          color: black,
        });
      };

      yesNo(1, 381, form.adminPanel);
      yesNo(1, 403, form.mobileResponsive);
      yesNo(1, 425, form.paymentGateway);
      yesNo(1, 447, form.whatsappSmsEmail);
      yesNo(1, 469, form.hostingDomain);

      // Project duration
      draw(1, form.projectDuration, 210, 670);

      // PAGE 3 — Payment Terms
      draw(2, form.totalCost, 215, 124);
      draw(2, form.advancePayment, 175, 155);
      draw(2, form.advancePercent, 285, 155);
      draw(2, form.secondPayment, 175, 177);
      draw(2, form.secondPercent, 285, 177);
      draw(2, form.finalPayment, 175, 199);
      draw(2, form.finalPercent, 285, 199);

      // Subscription block
      draw(2, form.monthlySubscription, 320, 405);
      draw(2, form.renewalDate, 475, 368);
      draw(2, form.subscriptionPlan, 405, 386);

      // PAGE 4 — Revisions & Support
      draw(3, form.revisionRounds, 175, 122);
      draw(3, form.freeSupportDays, 175, 524);

      // PAGE 5 — Signatures
      // Service Provider (left column ~x=72)
      draw(4, form.spName, 110, 737);
      draw(4, form.spDesignation, 140, 758);
      draw(4, form.spDate, 105, 779);

      // Client (right column ~x=324)
      draw(4, form.clientName, 362, 715);
      draw(4, form.companyName, 380, 737);
      draw(4, form.clientDesignation, 395, 759);
      draw(4, form.clientDate, 358, 780);

      const out = await pdf.save();
      // Convert to a fresh ArrayBuffer to satisfy Blob typing
      const buf = new ArrayBuffer(out.byteLength);
      new Uint8Array(buf).set(out);
      const blob = new Blob([buf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (form.clientName || "client").replace(/[^a-z0-9]+/gi, "_");
      a.download = `AGZUS_Agreement_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            AGZUS Client Agreement Generator
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Fill in the details below and download the completed AGZUS Client
            Service Agreement PDF.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void generate();
          }}
          className="space-y-8"
        >
          <Section title="1. Agreement Date">
            <Field label="Agreement Date" value={form.agreementDate} onChange={(v) => set("agreementDate", v)} type="date" />
          </Section>

          <Section title="2. Client Details">
            <Field label="Client Name" value={form.clientName} onChange={(v) => set("clientName", v)} />
            <Field label="Company Name" value={form.companyName} onChange={(v) => set("companyName", v)} />
            <Field label="Contact No" value={form.contactNo} onChange={(v) => set("contactNo", v)} />
            <Field label="Email" value={form.email} onChange={(v) => set("email", v)} type="email" />
            <Field label="Address" value={form.address} onChange={(v) => set("address", v)} full />
          </Section>

          <Section title="3. Project Scope">
            <Field label="Project Type" value={form.projectType} onChange={(v) => set("projectType", v)} />
            <Field label="Pages / Modules" value={form.pagesModules} onChange={(v) => set("pagesModules", v)} />
            <Field label="Main Features" value={form.mainFeatures} onChange={(v) => set("mainFeatures", v)} full />
            <Field label="Technology / Platform" value={form.technology} onChange={(v) => set("technology", v)} />
            <YesNo label="Admin Panel" value={form.adminPanel} onChange={(v) => set("adminPanel", v)} />
            <YesNo label="Mobile Responsive" value={form.mobileResponsive} onChange={(v) => set("mobileResponsive", v)} />
            <YesNo label="Payment Gateway" value={form.paymentGateway} onChange={(v) => set("paymentGateway", v)} />
            <YesNo label="WhatsApp / SMS / Email" value={form.whatsappSmsEmail} onChange={(v) => set("whatsappSmsEmail", v)} />
            <YesNo label="Hosting / Domain" value={form.hostingDomain} onChange={(v) => set("hostingDomain", v)} />
          </Section>

          <Section title="4. Project Timeline">
            <Field label="Estimated Project Duration (e.g. 30 days)" value={form.projectDuration} onChange={(v) => set("projectDuration", v)} />
          </Section>

          <Section title="5. Payment Terms">
            <Field label="Total Cost (Rs.)" value={form.totalCost} onChange={(v) => set("totalCost", v)} />
            <Field label="Advance Payment (Rs.)" value={form.advancePayment} onChange={(v) => set("advancePayment", v)} />
            <Field label="Advance %" value={form.advancePercent} onChange={(v) => set("advancePercent", v)} />
            <Field label="Second Payment (Rs.)" value={form.secondPayment} onChange={(v) => set("secondPayment", v)} />
            <Field label="Second %" value={form.secondPercent} onChange={(v) => set("secondPercent", v)} />
            <Field label="Final Payment (Rs.)" value={form.finalPayment} onChange={(v) => set("finalPayment", v)} />
            <Field label="Final %" value={form.finalPercent} onChange={(v) => set("finalPercent", v)} />
          </Section>

          <Section title="6. Subscription Terms">
            <Field label="Monthly Subscription Amount (Rs.)" value={form.monthlySubscription} onChange={(v) => set("monthlySubscription", v)} />
            <Field label="Renewal Date (e.g. 5th)" value={form.renewalDate} onChange={(v) => set("renewalDate", v)} />
            <Field label="Subscription Plan" value={form.subscriptionPlan} onChange={(v) => set("subscriptionPlan", v)} />
          </Section>

          <Section title="7. Revisions & Support">
            <Field label="Revision Rounds" value={form.revisionRounds} onChange={(v) => set("revisionRounds", v)} />
            <Field label="Free Support Days" value={form.freeSupportDays} onChange={(v) => set("freeSupportDays", v)} />
          </Section>

          <Section title="8. Signature Details">
            <Field label="Service Provider Name" value={form.spName} onChange={(v) => set("spName", v)} />
            <Field label="Service Provider Designation" value={form.spDesignation} onChange={(v) => set("spDesignation", v)} />
            <Field label="Service Provider Date" value={form.spDate} onChange={(v) => set("spDate", v)} type="date" />
            <Field label="Client Designation" value={form.clientDesignation} onChange={(v) => set("clientDesignation", v)} />
            <Field label="Client Date" value={form.clientDate} onChange={(v) => set("clientDate", v)} type="date" />
          </Section>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 sticky bottom-4">
            <button
              type="button"
              onClick={() => setForm(initial)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={generating}
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60"
            >
              {generating ? "Generating…" : "Generate Agreement PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-card-foreground">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  full = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "Yes" | "No";
  onChange: (v: "Yes" | "No") => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex gap-2">
        {(["Yes", "No"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              value === opt
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-accent"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
