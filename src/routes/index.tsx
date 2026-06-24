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
      const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
      const pages = pdf.getPages();
      const black = rgb(0.05, 0.05, 0.05);
      const white = rgb(1, 1, 1);

      // Draw text sitting just ABOVE the underscore line.
      // `labelTop` = pdfplumber top of the label/line row.
      // We add ~9pt to reach the line baseline, then place text 1pt above it.
      type DrawOpts = {
        size?: number;
        x2?: number; // right edge of the underscore line (for centering / maxWidth)
        center?: boolean;
        minSize?: number;
      };
      const drawIn = (
        pageIdx: number,
        text: string,
        x1: number,
        labelTop: number,
        opts: DrawOpts = {},
      ) => {
        if (!text) return;
        const activeFont = boldFont;
        const startSize = opts.size ?? 9;
        const minSize = opts.minSize ?? 6;
        const maxWidth = opts.x2 != null ? opts.x2 - x1 - 2 : undefined;
        let size = startSize;
        if (maxWidth) {
          while (
            size > minSize &&
            activeFont.widthOfTextAtSize(text, size) > maxWidth
          ) {
            size -= 0.5;
          }
        }
        const w = activeFont.widthOfTextAtSize(text, size);
        let x = x1;
        if (opts.center && opts.x2 != null) {
          x = x1 + Math.max(0, (opts.x2 - x1 - w) / 2);
        }
        // baseline ~4pt above the underscore (line ~ labelTop + 10)
        const y = PH - (labelTop + 6);
        pages[pageIdx].drawText(text, { x, y, size, font: activeFont, color: black });
      };

      // White-out a region (used to hide the "Yes / No" template text)
      const cover = (
        pageIdx: number,
        x: number,
        y: number,
        w: number,
        h: number,
      ) => {
        pages[pageIdx].drawRectangle({
          x,
          y: PH - y - h,
          width: w,
          height: h,
          color: white,
        });
      };

      const yesNo = (
        pageIdx: number,
        labelTop: number,
        value: "Yes" | "No",
      ) => {
        // Cover the template "Yes / No" text, then draw the selected value in the same spot.
        cover(pageIdx, 457, labelTop - 1, 38, 12);
        drawIn(pageIdx, value, 457, labelTop, {
          x2: 495,
          center: true,
          size: 10,
        });
      };

      // ============ PAGE 1 ============
      // "This Agreement is made on ___ between:" line is between x≈185 and x≈295, top≈195.3
      drawIn(0, form.agreementDate, 188, 195, {
        x2: 295,
        center: true,
        size: 9,
      });

      // Client Details — left-aligned at the start of each underscore, auto-shrinks if too long.
      drawIn(0, form.clientName, 382, 271.5, { x2: 565, size: 9 });
      drawIn(0, form.companyName, 400, 291.5, { x2: 565, size: 9 });
      drawIn(0, form.contactNo, 378, 311.5, { x2: 565, size: 9 });
      drawIn(0, form.email, 350, 331.5, { x2: 565, size: 9 });
      drawIn(0, form.address, 362, 351.5, { x2: 565, size: 9 });

      // ============ PAGE 2 ============
      // Project scope (left column underscore lines run to ~x=310)
      drawIn(1, form.projectType, 132, 378.7, { x2: 310, size: 9 });
      drawIn(1, form.pagesModules, 157, 401.9, { x2: 310, size: 9 });
      drawIn(1, form.mainFeatures, 140, 425.1, { x2: 310, size: 9 });
      drawIn(1, form.technology, 178, 448.3, { x2: 310, size: 9 });

      // Yes/No right column
      yesNo(1, 374.8, form.adminPanel);
      yesNo(1, 396.9, form.mobileResponsive);
      yesNo(1, 418.9, form.paymentGateway);
      yesNo(1, 440.9, form.whatsappSmsEmail);
      yesNo(1, 462.9, form.hostingDomain);

      // Estimated project duration: line 207.6→263.2 top=662.4
      drawIn(1, form.projectDuration, 210, 662.4, {
        x2: 263,
        center: true,
        size: 9,
      });

      // ============ PAGE 3 ============
      // Total Project Cost: after "Rs." x≈157, line ends ~x=295
      drawIn(2, total ? formatINR(total) : "", 160, 117.6, {
        x2: 295,
        size: 9,
      });

      // Advance: amount after "Rs." (~x=180) up to "/" (~x=290); percent in 307→343
      drawIn(2, total ? formatINR(advanceAmt) : "", 182, 147.9, {
        x2: 290,
        size: 9,
      });
      drawIn(2, form.advancePercent, 308, 147.9, { x2: 343, size: 9 });

      drawIn(2, total ? formatINR(secondAmt) : "", 177, 169.9, {
        x2: 290,
        size: 9,
      });
      drawIn(2, form.secondPercent, 308, 169.9, { x2: 343, size: 9 });

      drawIn(2, total ? formatINR(finalAmt) : "", 164, 191.9, {
        x2: 290,
        size: 9,
      });
      drawIn(2, form.finalPercent, 308, 191.9, { x2: 343, size: 9 });

      // Renewal Date (every month on ___ date): line 458→514 top=361.7
      drawIn(2, form.renewalDate, 460, 361.7, {
        x2: 514,
        center: true,
        size: 9,
      });
      // Subscription Plan: line ~399→570 top=379.1
      drawIn(2, form.subscriptionPlan, 400, 379.1, { x2: 570, size: 9 });
      // Monthly Subscription Rs.: line ~272→360 top=397.8
      drawIn(2, form.monthlySubscription, 274, 397.8, { x2: 360, size: 9 });

      // ============ PAGE 4 ============
      // "____________rounds" underscore is x≈151→205 (before the word "rounds")
      drawIn(3, form.revisionRounds, 155, 115.2, {
        x2: 205,
        center: true,
        size: 9,
      });
      // "Free support period: ___________ days" line 157→218 top=556.5
      drawIn(3, form.freeSupportDays, 158, 556.5, {
        x2: 218,
        center: true,
        size: 9,
      });

      // ============ PAGE 5 ============
      // SERVICE PROVIDER (left)
      // Authorized Signature line (top=710.5) — leave empty (signed by hand)
      // Name: line 110→252 top=731.5
      drawIn(4, form.spName, 112, 731.5, { x2: 252, size: 9 });
      // Designation: line 134→258 top=752.3
      drawIn(4, form.spDesignation, 136, 752.3, { x2: 258, size: 9 });
      // Date: ____/____/2026 — first ___ ≈108→130 (DD), second ___ ≈133→155 (MM)
      drawIn(4, form.spDateDD, 110, 774.3, { x2: 130, center: true, size: 9 });
      drawIn(4, form.spDateMM, 135, 774.3, { x2: 155, center: true, size: 9 });

      // CLIENT (right)
      // Client Signature line top=686.7 — leave empty
      // Name: line 362→503 top=709.6
      drawIn(4, form.clientName, 363, 709.6, { x2: 503, size: 9 });
      // Company: line ~388→517 top=731.5 (auto-shrinks if long)
      drawIn(4, form.companyName, 390, 731.5, { x2: 517, size: 9 });
      // Designation: line 390→519 top=752.3
      drawIn(4, form.clientDesignation, 392, 752.3, { x2: 519, size: 9 });
      // Date: ____/____/2026 — first ___ ≈360→380 (DD), second ___ ≈384→405 (MM)
      drawIn(4, form.clientDateDD, 361, 775.3, {
        x2: 381,
        center: true,
        size: 9,
      });
      drawIn(4, form.clientDateMM, 385, 775.3, {
        x2: 405,
        center: true,
        size: 9,
      });

      const out = await pdf.save();
      const buf = new ArrayBuffer(out.byteLength);
      new Uint8Array(buf).set(out);
      const blob = new Blob([buf], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (form.clientName || "client").replace(
        /[^a-z0-9]+/gi,
        "_",
      );
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
    <div className="min-h-screen bg-background py-6 px-4 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-xl font-bold text-foreground sm:text-3xl">
            AGZUS Client Agreement Generator
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2">
            Fill in the details below and download the completed AGZUS Client
            Service Agreement PDF.
          </p>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void generate();
          }}
          className="space-y-4 pb-32 sm:space-y-8 sm:pb-0"
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
                className="rounded-md border border-input bg-background px-3 py-3 text-base shadow-sm outline-none focus:ring-2 focus:ring-ring sm:py-2 sm:text-sm"
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

            <div className="col-span-1 sm:col-span-2 rounded-md border border-border bg-muted/40 p-3 sm:p-4 text-sm">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
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

          <div className="sticky bottom-0 -mx-4 sm:mx-0 flex flex-col gap-2 border-t border-border bg-background/95 px-4 py-4 backdrop-blur sm:static sm:flex-row sm:justify-end sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
            <button
              type="button"
              onClick={() => setForm(initial)}
              className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm font-medium hover:bg-accent sm:w-auto sm:py-2"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={generating}
              className="w-full rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60 sm:w-auto sm:py-2.5"
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
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
      <h2 className="mb-3 text-base font-semibold text-card-foreground sm:mb-4 sm:text-lg">{title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">{children}</div>
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
        className="rounded-md border border-input bg-background px-3 py-3 text-base shadow-sm outline-none focus:ring-2 focus:ring-ring sm:py-2 sm:text-sm"
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
            className={`flex-1 rounded-md border px-3 py-3 text-sm font-medium transition-colors sm:py-2 ${
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
