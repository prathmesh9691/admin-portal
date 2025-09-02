import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";

interface UploadedManual {
  id: string;
  file_name: string;
  uploaded_at: string;
  extracted_policies?: Array<{ title: string; content: string }>;
}

export default function UploadSection() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<UploadedManual | null>(null);
  const [uploadedManuals, setUploadedManuals] = useState<UploadedManual[]>([]);
  const [extracting, setExtracting] = useState<string | null>(null);
  const supabase = getSupabase();

  useEffect(() => {
    loadUploadedManuals();
  }, []);

  async function loadUploadedManuals() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("pdf_files")
        .select("id, file_name, uploaded_at")
        .order("uploaded_at", { ascending: false });
      
      if (error) throw error;
      setUploadedManuals(data || []);
    } catch (err: any) {
      toast.error("Failed to load uploaded manuals");
    }
  }

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
      if (!supabase) throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");

      // Read file as base64 and insert into SQL table `pdf_files`
      const base64 = await fileToBase64(file);
      const nowIso = new Date().toISOString();
      const { data: insertData, error: insertErr } = await supabase.from("pdf_files").insert({
        file_name: file.name,
        mime_type: "application/pdf",
        size_bytes: file.size,
        uploaded_at: nowIso,
        content_base64: base64,
      }).select().single();

      if (insertErr) throw insertErr;

      const uploadedManual = {
        id: insertData.id,
        file_name: file.name,
        uploaded_at: nowIso,
      };

      setLastUpload(uploadedManual);
      setUploadedManuals(prev => [uploadedManual, ...prev]);
      toast.success("PDF saved to Supabase SQL table");
      setFile(null);
    } catch (err: any) {
      const message = err.error_description || err.message || "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  async function extractPolicies(manualId: string) {
    if (extracting === manualId) return;
    setExtracting(manualId);
    
    try {
      const res = await fetch("/api/extract-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId: manualId })
      });
      
      if (!res.ok) throw new Error("Failed to extract policies");
      
      const extracted = await res.json();
      
      // Update the manual with extracted policies
      if (supabase) {
        const { error } = await supabase
          .from("pdf_files")
          .update({ extracted_policies: extracted.policies })
          .eq("id", manualId);
        
        if (error) throw error;
      }
      
      // Update local state
      setUploadedManuals(prev => prev.map(m => 
        m.id === manualId ? { ...m, extracted_policies: extracted.policies } : m
      ));
      
      toast.success("Policies extracted successfully");
    } catch (err: any) {
      toast.error(err.message || "Policy extraction failed");
    } finally {
      setExtracting(manualId);
    }
  }

  async function downloadManual(manual: UploadedManual) {
    try {
      if (!supabase) throw new Error("Supabase not configured");
      
      const { data, error } = await supabase
        .from("pdf_files")
        .select("content_base64")
        .eq("id", manual.id)
        .single();
      
      if (error || !data?.content_base64) throw new Error("File not found");
      
      // Convert base64 to blob and download
      const byteCharacters = atob(data.content_base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = manual.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Manual downloaded");
    } catch (err: any) {
      toast.error(err.message || "Download failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload HR Manuals</CardTitle>
        <CardDescription>Upload PDFs and extract policies with AI</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            accept=".pdf"
          />
          <Button type="submit" disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </form>

        {uploadedManuals.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Uploaded Manuals</h3>
            <div className="space-y-3">
              {uploadedManuals.map((manual) => (
                <div key={manual.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">{manual.file_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Uploaded {new Date(manual.uploaded_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadManual(manual)}
                      >
                        Download
                      </Button>
                      {!manual.extracted_policies && (
                        <Button
                          size="sm"
                          onClick={() => extractPolicies(manual.id)}
                          disabled={extracting === manual.id}
                        >
                          {extracting === manual.id ? "Extracting..." : "Extract Policies"}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {manual.extracted_policies && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-green-600 mb-2">
                        ✓ Policies Extracted
                      </div>
                      <div className="space-y-2">
                        {manual.extracted_policies.map((policy, index) => (
                          <div key={index} className="bg-gray-50 rounded p-2">
                            <div className="font-medium text-sm">{policy.title}</div>
                            <div className="text-xs text-muted-foreground">{policy.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
