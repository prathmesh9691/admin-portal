import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";
import OnboardingForm from "@/components/employee/OnboardingForm";
import AssessmentCenter from "@/components/employee/AssessmentCenter";

export default function Employee() {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("onboarding");
  const supabase = getSupabase();

  useEffect(() => {
    checkEmployeeStatus();
  }, []);

  async function checkEmployeeStatus() {
    if (!supabase) return;
    
    try {
      // Check if employee ID exists in localStorage
      const storedId = localStorage.getItem("pulsehr_employee_id");
      if (storedId) {
        setEmployeeId(storedId);
        
        // Check if onboarding is completed
        const { data, error } = await supabase
          .from("employee_onboarding")
          .select("completed")
          .eq("employee_id", storedId)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data?.completed) {
          setOnboardingCompleted(true);
          setActiveTab("assessments");
        }
      }
    } catch (err: any) {
      console.error("Failed to check employee status:", err);
    } finally {
      setLoading(false);
    }
  }

  async function generateEmployeeId() {
    if (!supabase) return;
    
    try {
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newId = `EMP${timestamp.slice(-6)}${random}`;
      
      // Check if ID already exists
      const { data: existing } = await supabase
        .from("employees")
        .select("id")
        .eq("employee_id", newId)
        .maybeSingle();
      
      if (existing) {
        // If exists, generate a new one
        return generateEmployeeId();
      }
      
      // Create new employee record
      const { error } = await supabase
        .from("employees")
        .insert({
          employee_id: newId,
          name: "New Employee",
          department: "General",
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setEmployeeId(newId);
      localStorage.setItem("pulsehr_employee_id", newId);
      toast.success(`Employee ID generated: ${newId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate employee ID");
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading employee portal...</p>
        </div>
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="container mx-auto p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Welcome to PulseHR</CardTitle>
            <CardDescription>Generate your employee ID to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={generateEmployeeId} className="w-full">
              Generate Employee ID
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Portal</h1>
          <p className="text-muted-foreground">Employee ID: {employeeId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setActiveTab("onboarding")}>
            Onboarding
          </Button>
          <Button variant="outline" onClick={() => setActiveTab("assessments")}>
            Assessments
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="assessments">Assessment Center</TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="space-y-6">
          {!onboardingCompleted ? (
            <OnboardingForm 
              employeeId={employeeId} 
              onComplete={() => {
                setOnboardingCompleted(true);
                setActiveTab("assessments");
                toast.success("Onboarding completed! You can now access assessments.");
              }} 
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Completed</CardTitle>
                <CardDescription>You have successfully completed your onboarding process.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-green-600 mb-2">Congratulations!</p>
                  <p className="text-muted-foreground mb-4">
                    Your onboarding is complete. You can now access the assessment center and training modules.
                  </p>
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
            <AssessmentCenter employeeId={employeeId} />
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
