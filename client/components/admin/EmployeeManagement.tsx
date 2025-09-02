import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  department: string;
  email?: string;
  created_at: string;
  onboarding_completed?: boolean;
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, employee_id, name, department, email, created_at")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Check onboarding status for each employee
      const employeesWithOnboarding = await Promise.all(
        (data || []).map(async (emp) => {
          const { data: onboardingData } = await supabase
            .from("employee_onboarding")
            .select("completed")
            .eq("employee_id", emp.id)
            .maybeSingle();
          
          return {
            ...emp,
            onboarding_completed: onboardingData?.completed || false
          };
        })
      );
      
      setEmployees(employeesWithOnboarding);
    } catch (err: any) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }

  async function downloadEmployeeData(employee: Employee) {
    try {
      if (!supabase) throw new Error("Supabase not configured");
      
      // Get employee details
      const { data: onboardingData } = await supabase
        .from("employee_onboarding")
        .select("*")
        .eq("employee_id", employee.id)
        .maybeSingle();
      
      // Get policy acknowledgments
      const { data: policyReads } = await supabase
        .from("policy_reads")
        .select("policy_id, read_at")
        .eq("employee_id", employee.id);
      
      // Get policies
      const policyIds = policyReads?.map(pr => pr.policy_id) || [];
      const { data: policies } = await supabase
        .from("pdf_files")
        .select("file_name, uploaded_at")
        .in("id", policyIds);
      
      // Create structured data
      const employeeData = {
        employee: {
          id: employee.employee_id,
          name: employee.name,
          department: employee.department,
          email: employee.email,
          created_at: employee.created_at,
          onboarding_completed: employee.onboarding_completed
        },
        onboarding: onboardingData || null,
        policies_acknowledged: policies || [],
        policy_reads: policyReads || []
      };
      
      // Download as JSON
      const dataStr = JSON.stringify(employeeData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = window.URL.createObjectURL(dataBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${employee.employee_id}_${employee.name}_data.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Employee data downloaded");
    } catch (err: any) {
      toast.error(err.message || "Download failed");
    }
  }

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Management</CardTitle>
        <CardDescription>View and manage employee information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search">Search Employees</Label>
              <Input
                id="search"
                placeholder="Search by name, ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={loadEmployees} disabled={loading} className="mt-6">
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>

          <div className="space-y-3">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? "Loading employees..." : "No employees found"}
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <div key={employee.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {employee.employee_id} • {employee.department}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created {new Date(employee.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        employee.onboarding_completed 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {employee.onboarding_completed ? "Onboarded" : "Pending"}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadEmployeeData(employee)}
                      >
                        Download Data
                      </Button>
                    </div>
                  </div>
                  
                  {employee.email && (
                    <div className="text-sm text-muted-foreground">
                      Email: {employee.email}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
