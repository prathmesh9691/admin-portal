import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";

export default function OnboardingForm({ employeeId, onComplete }: { employeeId: string; onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const steps = [
    { title: "Employee Details", description: "Basic personal information" },
    { title: "Contact Information", description: "Address and contact details" },
    { title: "Job Details", description: "Employment information" },
    { title: "Documents", description: "Required documents" },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase not configured");

      // Save onboarding data
      const { error } = await supabase.from("employee_onboarding").insert({
        employee_id: employeeId,
        completed: true,
        submitted_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Onboarding completed successfully!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to save onboarding data");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Employee Onboarding Form</CardTitle>
        <CardDescription>
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
        </CardDescription>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center py-8">
            <p className="text-lg text-muted-foreground">
              {steps[currentStep].description}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This is a simplified version. Full form will be implemented next.
            </p>
          </div>
          
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Complete Onboarding"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
