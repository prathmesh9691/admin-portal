"use client";  // ✅ ensure this is a client component

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Download, Search, FileText, CheckCircle, XCircle, Clock } from "lucide-react";

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  department: string;
}

interface DocumentUpload {
  id: string;
  employee_id: string;
  document_type: string;
  document_name: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  status: "pending" | "completed" | "skipped";
  uploaded_at: string;
  employees: Employee;
}

export default function EmployeeDocumentManager() {
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
    loadDocuments();
  }, []);

  async function loadEmployees() {
    try {
      const response = await fetch("/api/employees");
      if (!response.ok) throw new Error("Failed to load employees");
      const data = await response.json();
      setEmployees(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load employees");
    }
  }

  async function loadDocuments() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/employee-documents");
      if (!response.ok) throw new Error("Failed to load documents");
      const data = await response.json();
      setDocuments(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Browser-safe download handler
  async function downloadDocument(docItem: DocumentUpload) {
    try {
      const response = await fetch(`/api/admin/employee-documents/${docItem.id}/download`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const filename = docItem.file_name || `file-${docItem.id}`;
      const url = URL.createObjectURL(blob);

      if (typeof window !== "undefined" && typeof document !== "undefined") {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        // fallback if somehow not in browser
        window.open(url, "_blank");
      }

      toast.success("Document downloaded");
    } catch (err: any) {
      toast.error(err.message || "Download failed");
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesEmployee =
      selectedEmployee === "all" || doc.employee_id === selectedEmployee;
    const matchesStatus =
      selectedStatus === "all" || doc.status === selectedStatus;
    const matchesSearch =
      searchTerm === "" ||
      doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.employees.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.employees.employee_id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEmployee && matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "skipped":
        return <XCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case "skipped":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Skipped</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Pending</Badge>;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Employee Document Management</h2>
        <p className="text-muted-foreground mt-2">
          View and download employee uploaded documents
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button onClick={loadDocuments} variant="outline" className="w-full">
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
          <CardDescription>
            All employee document uploads with status and download options
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents found matching your criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{doc.employees.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {doc.employees.employee_id} • {doc.employees.department}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{doc.document_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{doc.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.status === "skipped" ? "-" : formatFileSize(doc.file_size_bytes)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(doc.status)}
                        {getStatusBadge(doc.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {doc.status === "completed" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadDocument(doc)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">No file</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
