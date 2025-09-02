import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";

interface EmployeeCreateRequest {
  name: string;
  department: string;
  email?: string;
}

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  department: string;
  email?: string;
  password_hash: string;
  created_at: string;
}

export default function EmployeeIdGenerator() {
  const [form, setForm] = useState<EmployeeCreateRequest>({ name: "", department: "", email: "" });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Employee | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const supabase = getSupabase();

  async function sha256Hex(input: string): Promise<string> {
    const enc = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function generateEmployeeId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EMP${timestamp.slice(-6)}${random}`;
  }

  function generatePassword(): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((n) => chars[n % chars.length])
      .join("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      toast.error("Supabase not configured");
      return;
    }
    
    setCreating(true);
    try {
      // Generate unique employee ID
      const employeeId = generateEmployeeId();
      
      // Generate secure password
      const password = generatePassword();
      const passwordHash = await sha256Hex(password);
      
      // Create employee record
      const { data: employee, error } = await supabase
        .from("employees")
        .insert({
          employee_id: employeeId,
          name: form.name,
          department: form.department,
          email: form.email || null,
          password_hash: passwordHash,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setCreated(employee);
      setGeneratedPassword(password);
      
      // Reset form
      setForm({ name: "", department: "", email: "" });
      
      toast.success("Employee ID generated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate employee ID");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee ID Generation</CardTitle>
        <CardDescription>Create a unique ID and password for a new employee</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Employee Name *</Label>
              <Input 
                id="name" 
                value={form.name} 
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                placeholder="Enter full name"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Input 
                id="department" 
                value={form.department} 
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} 
                placeholder="e.g., IT, HR, Sales"
                required 
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input 
                id="email" 
                type="email" 
                value={form.email || ""} 
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} 
                placeholder="employee@company.com"
              />
            </div>
          </div>
          
          <Button type="submit" disabled={creating} className="w-full">
            {creating ? "Generating..." : "Generate Employee ID & Password"}
          </Button>
          
          {created && (
            <div className="rounded-md border p-4 mt-4 bg-green-50">
              <div className="text-sm text-green-600 font-medium mb-2">✅ Employee Created Successfully!</div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Employee ID</div>
                  <div className="text-2xl font-bold tracking-tight text-green-700">{created.employee_id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Employee Details</div>
                  <div className="font-medium">{created.name} • {created.department}</div>
                  {created.email && <div className="text-sm text-gray-500">{created.email}</div>}
                </div>
                {generatedPassword && (
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <div className="text-sm text-yellow-800 font-medium mb-1">🔑 Temporary Password</div>
                    <div className="text-sm text-yellow-700 mb-2">Share this password with the employee for first login</div>
                    <div className="font-mono text-lg bg-white p-2 rounded border break-all text-center">
                      {generatedPassword}
                    </div>
                    <div className="text-xs text-yellow-600 mt-2">
                      ⚠️ This password will only be shown once. Employee should change it after first login.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
