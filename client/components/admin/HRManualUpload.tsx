import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Download, FileText, Trash2 } from "lucide-react";

interface HRCategory {
  id: string;
  name: string;
  description: string;
  order_index: number;
}

interface HRManual {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
  extracted_policies?: Array<{ title: string; content: string }>;
  category_id: string;
  hr_manual_categories: {
    name: string;
    description: string;
  };
}

export default function HRManualUpload() {
  const [categories, setCategories] = useState<HRCategory[]>([]);
  const [manuals, setManuals] = useState<HRManual[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [extracting, setExtracting] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    loadManuals();
  }, []);

  async function loadCategories() {
    try {
      let response = await fetch("/api/hr-categories");
      if (!response.ok) throw new Error("Failed to load categories");
      let data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        // Attempt ensure categories then use the returned list directly
        const ensured = await fetch("/api/hr-categories/ensure", { method: "POST" });
        if (!ensured.ok) throw new Error("Failed to initialize categories");
        data = await ensured.json();
      }
      setCategories(data);
    } catch (err: any) {
      toast.error("Failed to load categories");
    }
  }

  async function loadManuals() {
    try {
      const response = await fetch("/api/hr-manuals");
      if (!response.ok) throw new Error("Failed to load manuals");
      const data = await response.json();
      setManuals(data);
    } catch (err: any) {
      toast.error("Failed to load manuals");
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

  async function handleUpload(categoryId: string, file: File) {
    if (!isPdf(file)) {
      toast.error("Only PDF files are allowed");
      return;
    }

    // Client-side size guard: 50MB
    const MAX_BYTES = 50 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      toast.error(`File too large. Max 50MB; selected ${(file.size / (1024*1024)).toFixed(2)}MB`);
      return;
    }

    setUploading(categoryId);
    try {
      const base64 = await fileToBase64(file);
      
      const response = await fetch("/api/upload-hr-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          contentBase64: base64,
          categoryId: categoryId
        })
      });
      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || "Upload failed");
      }
      
      const uploadedManual = await response.json();
      setManuals(prev => [uploadedManual, ...prev]);
      toast.success("Manual uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(null);
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
      setManuals(prev => prev.map(m => 
        m.id === manualId ? { ...m, extracted_policies: extracted.policies } : m
      ));
      
      toast.success("Policies extracted successfully");
    } catch (err: any) {
      toast.error(err.message || "Policy extraction failed");
    } finally {
      setExtracting(null);
    }
  }

  async function downloadManual(manual: HRManual) {
    try {
      const response = await fetch(`/api/hr-manual/${manual.id}/download`);
      if (!response.ok) throw new Error("Download failed");
      
      const blob = await response.blob();
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

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function getManualsForCategory(categoryId: string): HRManual[] {
    return manuals.filter(manual => manual.category_id === categoryId);
  }

  // Show all 16 categories including Company Description
  const policyCategories = categories.sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">HR Manuals</h2>
        <p className="text-muted-foreground mt-2">Upload each policy document</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Policies</CardTitle>
          <CardDescription>Upload PDFs per policy. AI extraction is available after upload.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-md border">
            {policyCategories.map((category) => {
              const categoryManuals = getManualsForCategory(category.id);
              const isUploading = uploading === category.id;
              const last = categoryManuals[0];
              return (
                <div key={category.id} className="flex items-center justify-between p-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{category.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {categoryManuals.length > 0 ? (
                        <span>Last: {last.file_name} • {new Date(last.uploaded_at).toLocaleDateString()}</span>
                      ) : (
                        <span>No file uploaded</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUpload(category.id, file);
                          e.target.value = "";
                        }
                      }}
                      className="hidden"
                      id={`upload-${category.id}`}
                      accept=".pdf"
                    />
                    <Button
                      size="sm"
                      onClick={() => document.getElementById(`upload-${category.id}`)?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                    {last && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => downloadManual(last)}>
                          <Download className="h-4 w-4 mr-1" /> Download
                        </Button>
                        {!last.extracted_policies && (
                          <Button size="sm" onClick={() => extractPolicies(last.id)} disabled={extracting === last.id}>
                            {extracting === last.id ? "Extracting..." : "Extract Policies"}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
