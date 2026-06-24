import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AGZUS Client Agreement Generator" },
      {
        name: "description",
        content:
          "Fill in client and project details and download the completed AGZUS Client Service Agreement PDF.",
      },
    ],
  }),
  component: AgreementMaker,
});

type SplitOption = "50/30/20" | "40/40/20" | "30/40/30" | "Custom";

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
  paymentSplit: SplitOption;
  advancePercent: string;
  secondPercent: string;
  finalPercent: string;
  monthlySubscription: string;
  renewalDate: string;
  subscriptionPlan: string;
  revisionRounds: string;
  freeSupportDays: string;
  spName: string;
  spDesignation: string;
  spDateDD: string;
  spDateMM: string;
  clientDesignation: string;
  clientDateDD: string;
  clientDateMM: string;
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
  paymentSplit: "50/30/20",
  advancePercent: "50",
  secondPercent: "30",
  finalPercent: "20",
  monthlySubscription: "",
  renewalDate: "",
  subscriptionPlan: "",
  revisionRounds: "",
  freeSupportDays: "",
  spName: "",
  spDesignation: "",
  spDateDD: "",
  spDateMM: "",
  clientDesignation: "",
  clientDateDD: "",
  clientDateMM: "",
};

const PH = 842.25;
const Y = (top: number) => PH - top;

function formatINR(n: number) {
  if (!isFinite(n)) return "";
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.round(n),
  );
}

function AgreementMaker() {
  const [form, setForm] = useState<FormState>(initial);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSplitChange = (v: SplitOption) => {
    setForm((f) => {
      const next = { ...f, paymentSplit: v };
      if (v === "50/30/20") {
        next.advancePercent = "50";
        next.secondPercent = "30";
        next.finalPercent = "20";
      } else if (v === "40/40/20") {
        next.advancePercent = "40";
        next.secondPercent = "40";
        next.finalPercent = "20";
      } else if (v === "30/40/30") {
        next.advancePercent = "30";
        next.secondPercent = "40";
        next.finalPercent = "30";
      }
      return next;
    });
  };

  const total = parseFloat(form.totalCost) || 0;
  const aPct = parseFloat(form.advancePercent) || 0;
  const sPct = parseFloat(form.secondPercent) || 0;
  const fPct = parseFloat(form.finalPercent) || 0;
  const advanceAmt = useMemo(() => (total * aPct) / 100, [total, aPct]);
  const secondAmt = useMemo(() => (total * sPct) / 100, [total, sPct]);
  const finalAmt = useMemo(() => (total * fPct) / 100, [total, fPct]);
  const pctSum = aPct + sPct + fPct;

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/templates/agzus-client-service-agreement.pdf");
      if (!res.ok) throw new Error("Could not load PDF template");
      const bytes = await res.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      const black = rgb(0.05, 0.05, 0.05);
      const white = rgb(1, 1, 1);

      // Draw text just above the underscore line. Auto-shrink to fit maxWidth.
      const draw = (
        pageIdx: number,
        text: string,
        x: number,
        topY: number,
        opts: { size?: number; maxWidth?: number } = {},
      ) => {
        if (!text) return;
        let size = opts.size ?? 10;
        const maxWidth = opts.maxWidth;
        if (maxWidth) {
          while (size > 6 && font.widthOfTextAtSize(text, size) > maxWidth) {
            size -= 0.5;
          }
        }
        pages[pageIdx].drawText(text, {
          x,
          y: Y(topY) - size * 0.15,
          size,
          font,
          color: black,
        });
      };

      // Cover existing template text (e.g. "Yes / No") with a white rect
      const cover = (
        pageIdx: number,
        x: number,
        topY: number,
        w: number,
        h = 11,
      ) => {
        pages[pageIdx].drawRectangle({
          x,
          y: Y(topY) - 2,
          width: w,
          height: h,
          color: white,
        });
      };

      // ===== PAGE 1 =====
      // Agreement date between "made on" and "between:"
      draw(0, form.agreementDate, 207, 195, { maxWidth: 85 });

      // Client details (right column)
      draw(0, form.clientName, 382, 271, { maxWidth: 165 });
      draw(0, form.companyName, 382, 291, { maxWidth: 165 });
      draw(0, form.contactNo, 382, 311, { maxWidth: 165 });
      draw(0, form.email, 382, 331, { maxWidth: 165 });
      draw(0, form.address, 382, 351, { maxWidth: 165 });

      // ===== PAGE 2 — Project Scope =====
      draw(1, form.projectType, 150, 378, { maxWidth: 175 });
      draw(1, form.pagesModules, 155, 401, { maxWidth: 170 });
      draw(1, form.mainFeatures, 150, 424, { maxWidth: 175 });
      draw(1, form.technology, 175, 448, { maxWidth: 150 });

      // Yes/No: cover the "Yes / No" template text, draw only selected
      const yesNo = (pageIdx: number, top: number, value: "Yes" | "No") => {
        cover(pageIdx, 459, top, 30, 12);
        draw(pageIdx, value, 462, top, { size: 10 });
      };
      yesNo(1, 374, form.adminPanel);
      yesNo(1, 396, form.mobileResponsive);
      yesNo(1, 418, form.paymentGateway);
      yesNo(1, 440, form.whatsappSmsEmail);
      yesNo(1, 462, form.hostingDomain);

      // Project duration
      draw(1, form.projectDuration, 210, 662, { maxWidth: 55 });

      // ===== PAGE 3 — Payment Terms =====
      draw(2, total ? formatINR(total) : "", 162, 117, { maxWidth: 130 });
      // Advance: amount, percent
      draw(2, total ? formatINR(advanceAmt) : "", 185, 147, { maxWidth: 100 });
      draw(2, form.advancePercent, 310, 147, { size: 10 });
      draw(2, total ? formatINR(secondAmt) : "", 180, 169, { maxWidth: 100 });
      draw(2, form.secondPercent, 310, 169, { size: 10 });
      draw(2, total ? formatINR(finalAmt) : "", 168, 191, { maxWidth: 115 });
      draw(2, form.finalPercent, 310, 191, { size: 10 });

      // Subscription
      draw(2, form.renewalDate, 462, 361, { maxWidth: 50 });
      draw(2, form.subscriptionPlan, 405, 378, { maxWidth: 145 });
      draw(2, form.monthlySubscription, 280, 397, { maxWidth: 80 });

      // ===== PAGE 4 — Revisions & Support =====
      draw(3, form.revisionRounds, 158, 115, { maxWidth: 90 });
      draw(3, form.freeSupportDays, 160, 556, { maxWidth: 95 });

      // ===== PAGE 5 — Signatures =====
      // Service Provider (left)
      draw(4, form.spName, 112, 731, { maxWidth: 165 });
      draw(4, form.spDesignation, 136, 752, { maxWidth: 130 });
      // Date: ____/____/2026  — DD around x=112, MM around x=140
      draw(4, form.spDateDD, 115, 774, { size: 10 });
      draw(4, form.spDateMM, 142, 774, { size: 10 });

      // Client (right)
      draw(4, form.clientName, 362, 710, { maxWidth: 170 });
      draw(4, form.companyName, 380, 731, { maxWidth: 155 });
      draw(4, form.clientDesignation, 392, 752, { maxWidth: 145 });
      draw(4, form.clientDateDD, 365, 775, { size: 10 });
      draw(4, form.clientDateMM, 393, 775, { size: 10 });

      const out = await pdf.save();
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
            <Field
              label="Agreement Date"
              value={form.agreementDate}
              onChange={(v) => set("agreementDate", v)}
              type="date"
            />
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
            <Field
              label="Estimated Project Duration (e.g. 30 days)"
              value={form.projectDuration}
              onChange={(v) => set("projectDuration", v)}
            />
          </Section>

          <Section title="5. Payment Terms">
            <Field
              label="Total Project Cost (Rs.)"
              value={form.totalCost}
              onChange={(v) => set("totalCost", v)}
              type="number"
            />
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Payment Percentage Split
              </span>
              <select
                value={form.paymentSplit}
                onChange={(e) => onSplitChange(e.target.value as SplitOption)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="50/30/20">50% / 30% / 20%</option>
                <option value="40/40/20">40% / 40% / 20%</option>
                <option value="30/40/30">30% / 40% / 30%</option>
                <option value="Custom">Custom</option>
              </select>
            </label>

            {form.paymentSplit === "Custom" && (
              <>
                <Field
                  label="Advance %"
                  value={form.advancePercent}
                  onChange={(v) => set("advancePercent", v)}
                  type="number"
                />
                <Field
                  label="Second %"
                  value={form.secondPercent}
                  onChange={(v) => set("secondPercent", v)}
                  type="number"
                />
                <Field
                  label="Final %"
                  value={form.finalPercent}
                  onChange={(v) => set("finalPercent", v)}
                  type="number"
                />
              </>
            )}

            <div className="sm:col-span-2 rounded-md border border-border bg-muted/40 p-4 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <Calc label={`Advance (${form.advancePercent || 0}%)`} value={total ? `Rs. ${formatINR(advanceAmt)}` : "—"} />
                <Calc label={`Second (${form.secondPercent || 0}%)`} value={total ? `Rs. ${formatINR(secondAmt)}` : "—"} />
                <Calc label={`Final (${form.finalPercent || 0}%)`} value={total ? `Rs. ${formatINR(finalAmt)}` : "—"} />
              </div>
              {pctSum !== 100 && (
                <p className="mt-2 text-xs text-destructive">
                  Percentages add up to {pctSum}% (should be 100%).
                </p>
              )}
            </div>
          </Section>

          <Section title="6. Subscription Terms">
            <Field
              label="Monthly Subscription Amount (Rs.)"
              value={form.monthlySubscription}
              onChange={(v) => set("monthlySubscription", v)}
            />
            <Field
              label="Renewal Date (e.g. 5th)"
              value={form.renewalDate}
              onChange={(v) => set("renewalDate", v)}
            />
            <Field
              label="Subscription Plan"
              value={form.subscriptionPlan}
              onChange={(v) => set("subscriptionPlan", v)}
            />
          </Section>

          <Section title="7. Revisions & Support">
            <Field
              label="Revision Rounds"
              value={form.revisionRounds}
              onChange={(v) => set("revisionRounds", v)}
            />
            <Field
              label="Free Support Days"
              value={form.freeSupportDays}
              onChange={(v) => set("freeSupportDays", v)}
            />
          </Section>

          <Section title="8. Signature Details">
            <Field label="Service Provider Name" value={form.spName} onChange={(v) => set("spName", v)} />
            <Field
              label="Service Provider Designation"
              value={form.spDesignation}
              onChange={(v) => set("spDesignation", v)}
            />
            <div className="grid grid-cols-2 gap-3 sm:col-span-1">
              <Field label="SP Date — DD" value={form.spDateDD} onChange={(v) => set("spDateDD", v)} />
              <Field label="SP Date — MM" value={form.spDateMM} onChange={(v) => set("spDateMM", v)} />
            </div>
            <Field
              label="Client Designation"
              value={form.clientDesignation}
              onChange={(v) => set("clientDesignation", v)}
            />
            <div className="grid grid-cols-2 gap-3 sm:col-span-1">
              <Field label="Client Date — DD" value={form.clientDateDD} onChange={(v) => set("clientDateDD", v)} />
              <Field label="Client Date — MM" value={form.clientDateMM} onChange={(v) => set("clientDateMM", v)} />
            </div>
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              Year is already printed as <strong>/2026</strong> on the PDF template.
            </p>
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

function Calc({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold text-foreground">{value}</div>
    </div>
  );
}
