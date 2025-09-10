import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, CheckCircle, XCircle, FileText } from "lucide-react";

interface DocumentType {
  id: string;
  type_key: string;
  display_name: string;
  description: string;
  is_mandatory: boolean;
  is_applicable: boolean;
  order_index: number;
}

interface DocumentUpload {
  id: string;
  document_type: string;
  document_name: string;
  file_name: string;
  status: 'pending' | 'completed' | 'skipped';
  uploaded_at: string;
}

interface DocumentUploadProps {
  employeeId: string;
  onComplete: () => void;
}

export default function DocumentUpload({ employeeId, onComplete }: DocumentUploadProps) {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocumentTypes();
    loadExistingUploads();
  }, [employeeId]);

  async function loadDocumentTypes() {
    try {
      const response = await fetch("/api/document-types");
      if (!response.ok) throw new Error("Failed to load document types");
      const data = await response.json();
      setDocumentTypes(data.sort((a: DocumentType, b: DocumentType) => a.order_index - b.order_index));
    } catch (err: any) {
      toast.error(err.message || "Failed to load document types");
    } finally {
      setLoading(false);
    }
  }

  async function loadExistingUploads() {
    try {
      const response = await fetch(`/api/employee-documents/${employeeId}`);
      if (!response.ok) throw new Error("Failed to load existing uploads");
      const data = await response.json();
      setUploads(data);
    } catch (err: any) {
      console.error("Failed to load existing uploads:", err);
    }
  }

  const currentDocument = documentTypes[currentIndex];
  const currentUpload = uploads.find(u => u.document_type === currentDocument?.type_key);

  const mandatoryDocuments = documentTypes.filter(d => d.is_mandatory);
  const completedMandatory = mandatoryDocuments.filter(d => 
    uploads.some(u => u.document_type === d.type_key && u.status === 'completed')
  );
  const totalCompleted = uploads.filter(u => u.status === 'completed').length;
  const totalSkipped = uploads.filter(u => u.status === 'skipped').length;

  const progressPercentage = documentTypes.length > 0 ? (totalCompleted / documentTypes.length) * 100 : 0;
  const mandatoryProgress = mandatoryDocuments.length > 0 ? (completedMandatory.length / mandatoryDocuments.length) * 100 : 0;

  async function handleFileUpload(file: File) {
    if (!currentDocument) return;

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      
      const response = await fetch("/api/employee-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          documentType: currentDocument.type_key,
          documentName: currentDocument.display_name,
          fileName: file.name,
          fileContentBase64: base64,
          fileSizeBytes: file.size,
          mimeType: file.type
        })
      });

      if (!response.ok) throw new Error("Upload failed");
      
      const newUpload = await response.json();
      setUploads(prev => [...prev.filter(u => u.document_type !== currentDocument.type_key), newUpload]);
      toast.success("Document uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function skipDocument() {
    if (!currentDocument) return;

    try {
      const response = await fetch("/api/employee-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          documentType: currentDocument.type_key,
          documentName: currentDocument.display_name,
          fileName: "skipped",
          fileContentBase64: "",
          fileSizeBytes: 0,
          mimeType: "skipped",
          status: "skipped"
        })
      });

      if (!response.ok) throw new Error("Failed to skip document");
      
      const newUpload = await response.json();
      setUploads(prev => [...prev.filter(u => u.document_type !== currentDocument.type_key), newUpload]);
      toast.success("Document skipped");
    } catch (err: any) {
      toast.error(err.message || "Failed to skip document");
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

  const nextDocument = () => {
    if (currentIndex < documentTypes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Check if all mandatory documents are completed
      const allMandatoryCompleted = mandatoryDocuments.every(d => 
        uploads.some(u => u.document_type === d.type_key && u.status === 'completed')
      );
      
      if (allMandatoryCompleted) {
        onComplete();
      } else {
        toast.error("Please complete all mandatory documents before proceeding");
      }
    }
  };

  const prevDocument = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">Loading document types...</div>
        </CardContent>
      </Card>
    );
  }

  if (documentTypes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            No document types configured.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Document Upload</CardTitle>
        <CardDescription>
          Upload your documents one by one. Mandatory documents must be completed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{totalCompleted} of {documentTypes.length} documents</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex items-center justify-between text-sm">
              <span>Mandatory Documents</span>
              <span>{completedMandatory.length} of {mandatoryDocuments.length} completed</span>
            </div>
            <Progress value={mandatoryProgress} className="h-2" />
          </div>

          {/* Current Document */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {currentDocument.display_name}
                  {currentDocument.is_mandatory && (
                    <Badge variant="destructive" className="ml-2">Mandatory</Badge>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">{currentDocument.description}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {currentIndex + 1} of {documentTypes.length}
              </div>
            </div>

            {/* Upload Status */}
            {currentUpload && (
              <div className="mb-4 p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  {currentUpload.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : currentUpload.status === 'skipped' ? (
                    <XCircle className="h-5 w-5 text-orange-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-600" />
                  )}
                  <span className="font-medium">
                    {currentUpload.status === 'completed' ? 'Uploaded' : 
                     currentUpload.status === 'skipped' ? 'Skipped' : 'Pending'}
                  </span>
                  {currentUpload.status === 'completed' && (
                    <span className="text-sm text-muted-foreground">
                      - {currentUpload.file_name}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Upload Actions */}
            <div className="space-y-4">
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                    e.target.value = "";
                  }
                }}
                className="hidden"
                id="document-upload"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={() => document.getElementById('document-upload')?.click()}
                  disabled={uploading}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload Document"}
                </Button>
                
                {!currentDocument.is_mandatory && (
                  <Button
                    variant="outline"
                    onClick={skipDocument}
                    disabled={uploading}
                  >
                    Skip
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={prevDocument}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>

            <Button 
              onClick={nextDocument}
              disabled={currentIndex === documentTypes.length - 1 && !mandatoryDocuments.every(d => 
                uploads.some(u => u.document_type === d.type_key && u.status === 'completed')
              )}
            >
              {currentIndex === documentTypes.length - 1 ? "Complete Upload" : "Next Document"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
