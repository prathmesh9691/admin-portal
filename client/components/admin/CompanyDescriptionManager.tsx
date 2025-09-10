import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileText, Trash2 } from "lucide-react";

interface CompanyDescriptionPage {
  id: string;
  page_number: number;
  title: string;
  content_base64: string;
  file_name: string;
  uploaded_at: string;
}

export default function CompanyDescriptionManager() {
  const [pages, setPages] = useState<CompanyDescriptionPage[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    try {
      setLoading(true);
      const response = await fetch("/api/company-description-pages");
      if (!response.ok) throw new Error("Failed to load company description pages");
      const data = await response.json();
      setPages(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load company description pages");
    } finally {
      setLoading(false);
    }
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

  async function handleUpload(pageNumber: number, file: File, title: string) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error("Only PDF files are allowed");
      return;
    }

    setUploading(pageNumber);
    try {
      const base64 = await fileToBase64(file);
      
      const response = await fetch("/api/company-description-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageNumber,
          title,
          contentBase64: base64,
          fileName: file.name
        })
      });

      if (!response.ok) throw new Error("Upload failed");
      
      const uploadedPage = await response.json();
      setPages(prev => {
        const filtered = prev.filter(p => p.page_number !== pageNumber);
        return [...filtered, uploadedPage].sort((a, b) => a.page_number - b.page_number);
      });
      toast.success(`Page ${pageNumber} uploaded successfully`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  const pageTitles = [
    "Company Overview",
    "Our Mission & Values", 
    "Company Culture",
    "Welcome to Brandsmashers Tech"
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Company Description Pages</h2>
        <p className="text-muted-foreground mt-2">
          Upload 4 pages that employees will see on first login
        </p>
      </div>

      <div className="grid gap-6">
        {[1, 2, 3, 4].map((pageNumber) => {
          const page = pages.find(p => p.page_number === pageNumber);
          const isUploading = uploading === pageNumber;
          
          return (
            <Card key={pageNumber}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Page {pageNumber}: {pageTitles[pageNumber - 1]}
                </CardTitle>
                <CardDescription>
                  {page ? `Uploaded: ${page.file_name} (${new Date(page.uploaded_at).toLocaleString()})` : "No page uploaded yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`title-${pageNumber}`}>Page Title</Label>
                      <Input
                        id={`title-${pageNumber}`}
                        defaultValue={pageTitles[pageNumber - 1]}
                        placeholder="Enter page title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`file-${pageNumber}`}>PDF File</Label>
                      <input
                        type="file"
                        id={`file-${pageNumber}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          const titleInput = document.getElementById(`title-${pageNumber}`) as HTMLInputElement;
                          if (file && titleInput) {
                            handleUpload(pageNumber, file, titleInput.value);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                        accept=".pdf"
                      />
                      <Button
                        onClick={() => document.getElementById(`file-${pageNumber}`)?.click()}
                        disabled={isUploading}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? "Uploading..." : page ? "Replace PDF" : "Upload PDF"}
                      </Button>
                    </div>
                  </div>

                  {page && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {page.file_name}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const blob = new Blob([Buffer.from(page.content_base64, 'base64')], { type: 'application/pdf' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = page.file_name;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          }}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
