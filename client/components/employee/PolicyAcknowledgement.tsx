import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle, FileText } from "lucide-react";

function PolicyPdfViewer({ categoryId }: { categoryId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/hr-manuals/${categoryId}`);
        if (!res.ok) throw new Error("Failed to load manual");
        const manuals = await res.json();
        if (manuals && manuals.length > 0) {
          const latest = manuals[0];
          const dl = await fetch(`/api/hr-manual/${latest.id}/download`);
          if (!dl.ok) throw new Error("Failed to download manual");
          const blob = await dl.blob();
          const obj = URL.createObjectURL(blob);
          if (active) setUrl(`${obj}#page=1`);
        } else {
          if (active) setUrl(null);
        }
      } catch {
        if (active) setUrl(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [categoryId]);
  if (loading) return <div className="text-sm text-muted-foreground">Loading PDF...</div>;
  if (!url) return <div className="text-sm text-muted-foreground">No policy document uploaded for this section.</div>;
  return (
    <div className="aspect-[1/1.414] w-full border rounded overflow-hidden bg-white">
      <iframe title="Policy PDF" src={url} className="w-full h-[60vh]" />
    </div>
  );
}

interface PolicyCategory {
  id: string;
  name: string;
  description: string;
  order_index: number;
}

interface PolicyAcknowledgement {
  id: string;
  employee_id: string;
  policy_category_id: string;
  acknowledged_at: string;
}

interface PolicyAcknowledgementProps {
  employeeId: string;
  onComplete: () => void;
}

export default function PolicyAcknowledgement({ employeeId, onComplete }: PolicyAcknowledgementProps) {
  const [categories, setCategories] = useState<PolicyCategory[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [acknowledgements, setAcknowledgements] = useState<PolicyAcknowledgement[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    loadAcknowledgements();
  }, [employeeId]);

  async function loadCategories() {
    try {
      setLoading(true);
      const response = await fetch("/api/hr-categories");
      if (!response.ok) throw new Error("Failed to load policy categories");
      const data = await response.json();
      
      // Filter out Company Description and sort by order
      const policyCategories = data
        .filter((c: PolicyCategory) => c.name.toLowerCase() !== "company description")
        .sort((a: PolicyCategory, b: PolicyCategory) => a.order_index - b.order_index);
      
      setCategories(policyCategories);
    } catch (err: any) {
      toast.error(err.message || "Failed to load policy categories");
    } finally {
      setLoading(false);
    }
  }

  async function loadAcknowledgements() {
    try {
      const response = await fetch(`/api/policy-acknowledgements/${employeeId}`);
      if (!response.ok) throw new Error("Failed to load acknowledgements");
      const data = await response.json();
      setAcknowledgements(data);
    } catch (err: any) {
      console.error("Failed to load acknowledgements:", err);
    }
  }

  const currentCategory = categories[currentIndex];
  const isAcknowledged = currentCategory && acknowledgements.some(a => a.policy_category_id === currentCategory.id);

  const acknowledgedCount = acknowledgements.length;
  const progressPercentage = categories.length > 0 ? (acknowledgedCount / categories.length) * 100 : 0;

  async function acknowledgePolicy() {
    if (!currentCategory) return;

    try {
      const response = await fetch("/api/policy-acknowledgements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          policyCategoryId: currentCategory.id
        })
      });

      if (!response.ok) throw new Error("Failed to acknowledge policy");
      
      const newAcknowledgement = await response.json();
      setAcknowledgements(prev => [...prev, newAcknowledgement]);
      setAcknowledged(true);
      toast.success("Policy acknowledged successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to acknowledge policy");
    }
  }

  const nextPolicy = () => {
    if (currentIndex < categories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAcknowledged(false);
    } else {
      onComplete();
    }
  };

  const prevPolicy = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setAcknowledged(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">Loading HR policies...</div>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            No HR policies available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>HR Policy Acknowledgement</CardTitle>
        <CardDescription>
          Please read and acknowledge each HR policy. You must acknowledge all policies to proceed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Policy Acknowledgement Progress</span>
              <span>{acknowledgedCount} of {categories.length} policies acknowledged</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Current Policy */}
          <div className="border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{currentCategory.name}</h3>
                <p className="text-sm text-muted-foreground">{currentCategory.description}</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {currentIndex + 1} of {categories.length}
              </div>
            </div>

            {/* Policy Content Viewer */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Policy Document</span>
                {isAcknowledged && <CheckCircle className="h-5 w-5 text-green-600" />}
              </div>
              {/* Load latest manual PDF for this category and show inline */}
              <PolicyPdfViewer categoryId={currentCategory.id} />
              <p className="text-xs text-muted-foreground mt-2">Please read the policy document carefully before acknowledging.</p>
            </div>

            {/* Acknowledgement Checkbox */}
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acknowledge"
                  checked={acknowledged || isAcknowledged}
                  onCheckedChange={(checked) => {
                    if (checked && !isAcknowledged) {
                      acknowledgePolicy();
                    }
                  }}
                  disabled={isAcknowledged}
                />
                <label htmlFor="acknowledge" className="text-sm font-medium">
                  I have read and understood the {currentCategory.name} policy
                </label>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={prevPolicy}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>

            <Button 
              onClick={nextPolicy}
              disabled={!isAcknowledged}
            >
              {currentIndex === categories.length - 1 ? "Go to Assessment" : "Next Policy"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
