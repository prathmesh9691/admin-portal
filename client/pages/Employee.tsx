import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiJson } from "@/lib/api";
import type { Employee } from "@shared/api";

export default function EmployeePage() {
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Employee | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setData(null);
    try {
      const res = await apiJson<Employee>(`/employee/${encodeURIComponent(employeeId)}`);
      setData(res);
    } catch (err: any) {
      toast.error(err.message || "Employee not found");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Employee Portal</CardTitle>
            <CardDescription>Enter your Employee ID to view your details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input id="employeeId" placeholder="BST12345" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading}>{loading ? "Loading..." : "View Details"}</Button>
            </form>
            {data && (
              <div className="mt-6 rounded-md border p-4 space-y-1">
                <div className="text-xs text-muted-foreground">Employee ID</div>
                <div className="font-semibold">{data.employeeId}</div>
                <div className="text-xs text-muted-foreground mt-3">Name</div>
                <div>{data.name}</div>
                <div className="text-xs text-muted-foreground mt-3">Department</div>
                <div>{data.department}</div>
                {data.email && (
                  <>
                    <div className="text-xs text-muted-foreground mt-3">Email</div>
                    <div>{data.email}</div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
