import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiFormData } from "@/lib/api";
import type { UploadResponse } from "@shared/api";
import { getSupabase, SUPABASE_BUCKET } from "@/lib/supabase";

export default function UploadSection() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<UploadResponse | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  function isPdf(selected: File) {
    return selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf");
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",").pop() || "";
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Select a file first");
    if (!isPdf(file)) return toast.error("Only PDF files are allowed");
    setUploading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");

      // Read file as base64 and insert into SQL table `pdf_files`
      const base64 = await fileToBase64(file);
      const nowIso = new Date().toISOString();
      const { error: insertErr } = await supabase.from("pdf_files").insert({
        file_name: file.name,
        mime_type: "application/pdf",
        size_bytes: file.size,
        uploaded_at: nowIso,
        content_base64: base64,
      });
      if (insertErr) throw insertErr;

      setLastUpload({ id: Date.now(), fileName: file.name, uploadedAt: nowIso });
      setPdfPreviewUrl(`data:application/pdf;base64,${base64}`);
      toast.success("PDF saved to Supabase SQL table");
      setFile(null);
    } catch (err: any) {
      const message = err.error_description || err.message || "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>Upload HR Manuals, CODs, and other resources</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            accept=".pdf"
          />
          <Button type="submit" disabled={!file || uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
          {lastUpload && (
            <div className="text-sm text-muted-foreground">
              Last upload: <span className="font-medium text-foreground">{lastUpload.fileName}</span> at {new Date(lastUpload.uploadedAt).toLocaleString()}
            </div>
          )}
        </form>
        {pdfPreviewUrl && (
          <div className="mt-6">
            <div className="mb-2 text-sm font-medium">Preview:</div>
            <iframe
              title="Uploaded PDF Preview"
              src={pdfPreviewUrl}
              className="w-full h-[70vh] border rounded-md"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
