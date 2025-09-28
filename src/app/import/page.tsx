"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function upload() {
    if (!file || uploading) return;
    setUploading(true);
    setResponse(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import/excel", { method: "POST", body: formData });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Excel import"
        description="Upload an outreach spreadsheet to quickly add people, assignments, and milestones into the system."
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Import file</CardTitle>
          <CardDescription>
            Supports .xlsx and .xls exports with columns for Name, Outreach, Current Role, Coach Email, and Goal Target Role.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500 hover:border-slate-400">
            <span className="font-medium text-slate-700">
              {file ? file.name : "Drag and drop or browse for a spreadsheet"}
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={event => setFile(event.target.files?.[0] ?? null)}
            />
            <span className="mt-2 text-xs text-slate-500">Max 5 MB | Only spreadsheet formats are accepted</span>
          </label>
          <div className="flex items-center gap-3">
            <Button onClick={upload} disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            {file && (
              <Button variant="ghost" onClick={() => { setFile(null); setResponse(null); }}>
                Clear selection
              </Button>
            )}
          </div>
          {response && (
            <pre className="max-h-64 overflow-auto rounded-2xl bg-slate-900 px-4 py-3 text-xs text-slate-100">
              {response}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-3xl border-dashed">
        <CardHeader>
          <CardTitle>Template tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Each row should include:</p>
          <ul className="list-disc pl-5">
            <li>Person name (required)</li>
            <li>Outreach name (optional - new outreaches will be created automatically)</li>
            <li>Current role and coach email (optional)</li>
            <li>Target goal role and target date (optional)</li>
          </ul>
          <p className="text-xs text-slate-500">
            Tip: keep a "TargetRole" column in your source workbook so you can import repeatedly without manual cleanup.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
