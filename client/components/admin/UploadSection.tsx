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

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Select a file first");
    setUploading(true);
    try {
      const supabase = getSupabase();
      if (supabase && SUPABASE_BUCKET) {
        try {
          const path = `${Date.now()}_${file.name}`;
          const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(path, file, { upsert: false });
          if (error) throw error;
          await supabase.from("files").insert({ file_name: file.name, storage_path: path, uploaded_at: new Date().toISOString() }).catch(() => {});
          setLastUpload({ id: Date.now(), fileName: file.name, uploadedAt: new Date().toISOString() });
          toast.success("Uploaded to Supabase");
          setFile(null);
          return;
        } catch (err: any) {
          if (String(err?.message || "").includes("Bucket not found")) {
            toast.message("Supabase bucket not found, falling back to local API upload.");
          } else {
            throw err;
          }
        }
      }
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFormData<UploadResponse>("/upload", fd, { method: "POST" });
      setLastUpload(res);
      toast.success("File uploaded");
      setFile(null);
      setFile(null);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
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
            accept=".pdf,.doc,.docx,.txt,image/*"
          />
          <Button type="submit" disabled={!file || uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
          {lastUpload && (
            <div className="text-sm text-muted-foreground">
              Last upload: <span className="font-medium text-foreground">{lastUpload.fileName}</span> at {new Date(lastUpload.uploadedAt).toLocaleString()}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
