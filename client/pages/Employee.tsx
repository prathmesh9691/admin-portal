import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";
import OnboardingForm from "@/components/employee/OnboardingForm";
import AssessmentCenter from "@/components/employee/AssessmentCenter";
import CompanyDescriptionPages from "@/components/employee/CompanyDescriptionPages";
import DocumentUpload from "@/components/employee/DocumentUpload";
import PolicyAcknowledgement from "@/components/employee/PolicyAcknowledgement";

interface EmployeeSession {
  id: string;
  employee_id: string;
  name: string;
  department: string;
}

export default function Employee() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [companyIntroDone, setCompanyIntroDone] = useState(false);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [policiesAcknowledged, setPoliciesAcknowledged] = useState(false);
  const [activeTab, setActiveTab] = useState("onboarding");
  const supabase = getSupabase();

  useEffect(() => {
    // Check if employee is already logged in
    const storedSession = localStorage.getItem("pulsehr_employee");
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        setSession(sessionData);
        checkOnboardingStatus(sessionData.id);
      } catch (e) {
        localStorage.removeItem("pulsehr_employee");
      }
    }
  }, []);

  async function checkOnboardingStatus(employeeId: string) {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from("employee_onboarding")
        .select("completed")
        .eq("employee_id", employeeId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data?.completed) {
        setOnboardingCompleted(true);
      }
    } catch (err: any) {
      console.error("Failed to check onboarding status:", err);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    const idPattern = /^BST\d{5}$/;
    if (!idPattern.test(employeeId)) {
      toast.error("Employee ID must be BST followed by 5 digits (e.g., BST12345)");
      return;
    }
    
    setLoading(true);
    try {
      // Hash the password for comparison
      const passwordHash = await sha256Hex(password);
      
      // Find employee with matching credentials
      const { data: employee, error } = await supabase
        .from("employees")
        .select("id, employee_id, name, department")
        .eq("employee_id", employeeId)
        .eq("password_hash", passwordHash)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!employee) {
        toast.error("Invalid employee ID or password");
        return;
      }
      
      // Store session
      const sessionData = {
        id: employee.id,
        employee_id: employee.employee_id,
        name: employee.name,
        department: employee.department
      };
      
      setSession(sessionData);
      localStorage.setItem("pulsehr_employee", JSON.stringify(sessionData));
      
      // Check onboarding status
      await checkOnboardingStatus(employee.id);
      
      toast.success(`Welcome, ${employee.name}!`);
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function sha256Hex(input: string): Promise<string> {
    const enc = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function handleLogout() {
    setSession(null);
    setOnboardingCompleted(false);
    localStorage.removeItem("pulsehr_employee");
    toast.success("Logged out successfully");
  }

  // Show login form if not authenticated
  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Employee Login</CardTitle>
              <CardDescription>Login with your employee ID and password provided by admin</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input 
                    id="employeeId" 
                    value={employeeId} 
                    onChange={(e) => setEmployeeId(e.target.value)} 
                    placeholder="e.g., BST12345"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Enter your password"
                    required 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                
                <div className="text-center text-sm text-muted-foreground">
                  <p>Don't have credentials?</p>
                  <p>Contact your admin to get your employee ID and password.</p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Portal</h1>
          <p className="text-muted-foreground">
            Welcome, {session.name} • ID: {session.employee_id} • {session.department}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setActiveTab("onboarding")}>
            Onboarding
          </Button>
          <Button variant="outline" onClick={() => setActiveTab("assessments")}>
            Assessments
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="assessments">Assessment Center</TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="space-y-6">
          {!companyIntroDone ? (
            <CompanyDescriptionPages onComplete={() => setCompanyIntroDone(true)} />
          ) : !onboardingCompleted ? (
            <OnboardingForm 
              employeeId={session.id} 
              onComplete={() => {
                setOnboardingCompleted(true);
              }} 
            />
          ) : !documentsUploaded ? (
            <DocumentUpload 
              employeeId={session.id}
              onComplete={() => setDocumentsUploaded(true)}
            />
          ) : !policiesAcknowledged ? (
            <PolicyAcknowledgement 
              employeeId={session.id}
              onComplete={() => { setPoliciesAcknowledged(true); setActiveTab("assessments"); }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Ready for Assessment</CardTitle>
                <CardDescription>You have completed all onboarding steps.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Button onClick={() => setActiveTab("assessments")}>
                    Go to Assessment Center
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          {onboardingCompleted ? (
            <AssessmentCenter employeeId={session.id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Assessment Center</CardTitle>
                <CardDescription>Complete your onboarding to access assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>Please complete your onboarding process first to access assessments and training.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setActiveTab("onboarding")}
                  >
                    Complete Onboarding
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

