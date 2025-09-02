import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiJson } from "@/lib/api";
import type { Employee, EmployeeCreateRequest } from "@shared/api";
import { getSupabase } from "@/lib/supabase";

export default function EmployeeIdGenerator() {
  const [form, setForm] = useState<EmployeeCreateRequest>({ name: "", department: "", email: "" });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Employee | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await apiJson<Employee>("/generate-employee-id", { method: "POST", body: form });
      setCreated(res);
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("employees").insert({
          employee_id: res.employeeId,
          name: res.name,
          department: res.department,
          email: res.email ?? null,
          created_at: new Date().toISOString(),
        }).catch(() => {});
      }
      toast.success("Employee ID generated");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate ID");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee ID Generation</CardTitle>
        <CardDescription>Create a unique ID for a new employee</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept">Department</Label>
              <Input id="dept" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} required />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" value={form.email || ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <Button type="submit" disabled={creating}>{creating ? "Generating..." : "Generate ID"}</Button>
          {created && (
            <div className="rounded-md border p-4 mt-2">
              <div className="text-sm text-muted-foreground">Generated Employee ID</div>
              <div className="text-2xl font-bold tracking-tight">{created.employeeId}</div>
              <div className="text-sm mt-1">{created.name} · {created.department}</div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
