"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const SAMPLE = [
  { name: "Robert Williams", birth: "1935-03-14", parent: "", partner: "Margaret Roberts" },
  { name: "Margaret Roberts", birth: "1938-07-22", parent: "", partner: "Robert Williams" },
  { name: "James Williams", birth: "1960-05-09", parent: "Robert Williams", partner: "Patricia Moore" },
];

export default function ImportPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState(SAMPLE);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-4xl px-6 py-8 sm:px-10">
        <h1 className="font-serif text-4xl text-charcoal">Import family tree</h1>
        <p className="mt-2 text-sm text-soft">Bring a CSV or GEDCOM file into a calm, visual tree.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="cursor-pointer rounded-3xl border border-dashed border-line bg-white p-6 text-center hover:border-forest">
            <p className="font-serif text-2xl">CSV</p>
            <p className="mt-2 text-sm text-soft">Name, birth date, parent, partner</p>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setFileName(file.name);
                const reader = new FileReader();
                reader.onload = () => {
                  const text = String(reader.result || "");
                  const parsed = text
                    .split(/\r?\n/)
                    .slice(1)
                    .map((line) => line.split(",").map((c) => c.trim()))
                    .filter((cols) => cols[0])
                    .map((cols) => ({
                      name: cols[0] || "",
                      birth: cols[1] || "",
                      parent: cols[2] || "",
                      partner: cols[3] || "",
                    }));
                  if (parsed.length) setRows(parsed);
                };
                reader.readAsText(file);
              }}
            />
            <p className="mt-4 text-xs text-forest">{fileName || "Upload a file"}</p>
          </label>
          <div className="rounded-3xl border border-line bg-cream p-6">
            <p className="font-serif text-2xl">GEDCOM</p>
            <p className="mt-2 text-sm text-soft">Coming in a later release. We’ll preserve sources, dates, and family links.</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-[11px] uppercase tracking-[0.12em] text-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Birth Date</th>
                <th className="px-4 py-3 font-medium">Parent</th>
                <th className="px-4 py-3 font-medium">Partner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-t border-line">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 text-soft">{row.birth}</td>
                  <td className="px-4 py-3 text-soft">{row.parent || "—"}</td>
                  <td className="px-4 py-3 text-soft">{row.partner || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-charcoal">{rows.length} people ready to import</p>
          <Button
            onClick={() => {
              router.push("/tree");
            }}
          >
            Import family tree
          </Button>
        </div>
      </div>
    </div>
  );
}
