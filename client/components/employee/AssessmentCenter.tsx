import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";
import { Assessment, AssessmentQuestion, AssessmentAttempt } from "@shared/api";

export default function AssessmentCenter({ employeeId }: { employeeId: string }) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  
  const supabase = getSupabase();

  useEffect(() => {
    loadData();
  }, [employeeId]);

  async function loadData() {
    if (!supabase) return;
    setLoading(true);
    try {
      await Promise.all([loadAssessments(), loadAttempts()]);
    } catch (err: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function loadAssessments() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("is_active", true);
      
      if (error) throw error;
      setAssessments(data || []);
    } catch (err: any) {
      console.error("Failed to load assessments:", err);
    }
  }

  async function loadAttempts() {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select("*, assessments(*)")
        .eq("employee_id", employeeId);
      
      if (error) throw error;
      setAttempts(data || []);
    } catch (err: any) {
      console.error("Failed to load attempts:", err);
    }
  }

  async function startAssessment(assessment: Assessment) {
    if (!supabase) return;
    try {
      const { data: questions, error } = await supabase
        .from("assessment_questions")
        .select("*")
        .eq("assessment_id", assessment.id)
        .order("order_index");
      
      if (error) throw error;

      const session = {
        assessment,
        questions,
        currentQuestion: 0,
        answers: new Map(),
        timeRemaining: assessment.duration_minutes * 60,
        isActive: true
      };

      setActiveSession(session);
      toast.success("Assessment started!");
    } catch (err: any) {
      toast.error("Failed to start assessment");
    }
  }

  const getAssessmentStatus = (assessmentId: string) => {
    const attempt = attempts.find(a => a.assessment_id === assessmentId);
    if (!attempt) return { status: "not_started", label: "Not Started", variant: "secondary" };
    if (attempt.status === "completed") {
      return { 
        status: "completed", 
        label: attempt.passed ? "Passed" : "Failed", 
        variant: attempt.passed ? "default" : "destructive" 
      };
    }
    return { status: "in_progress", label: "In Progress", variant: "default" };
  };

  if (activeSession) {
    const currentQ = activeSession.questions[activeSession.currentQuestion];
    const progress = ((activeSession.currentQuestion + 1) / activeSession.questions.length) * 100;
    
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{activeSession.assessment.title}</CardTitle>
          <CardDescription>Question {activeSession.currentQuestion + 1} of {activeSession.questions.length}</CardDescription>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg font-medium">{currentQ.question_text}</div>
          
          {currentQ.question_type === "mcq" && currentQ.options && (
            <RadioGroup
              value={activeSession.answers.get(currentQ.id) || ""}
              onValueChange={(value) => {
                const newAnswers = new Map(activeSession.answers);
                newAnswers.set(currentQ.id, value);
                setActiveSession({ ...activeSession, answers: newAnswers });
              }}
            >
              {currentQ.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setActiveSession({ ...activeSession, currentQuestion: activeSession.currentQuestion - 1 })}
              disabled={activeSession.currentQuestion === 0}
            >
              Previous
            </Button>
            
            {activeSession.currentQuestion === activeSession.questions.length - 1 ? (
              <Button onClick={() => setActiveSession(null)}>
                Submit Assessment
              </Button>
            ) : (
              <Button onClick={() => setActiveSession({ ...activeSession, currentQuestion: activeSession.currentQuestion + 1 })}>
                Next Question
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assessment Center</CardTitle>
          <CardDescription>Take assessments and track your progress</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading assessments...</div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No assessments available
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => {
                const status = getAssessmentStatus(assessment.id);
                return (
                  <div key={assessment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{assessment.title}</h3>
                          <Badge variant={status.variant as any}>{status.label}</Badge>
                          <Badge variant="outline">{assessment.type}</Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">{assessment.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Duration:</span> {assessment.duration_minutes} min
                          </div>
                          <div>
                            <span className="font-medium">Questions:</span> {assessment.total_questions}
                          </div>
                          <div>
                            <span className="font-medium">Passing Score:</span> {assessment.passing_score}%
                          </div>
                          <div>
                            <span className="font-medium">Category:</span> {assessment.category}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {status.status === "not_started" && (
                          <Button onClick={() => startAssessment(assessment)}>
                            Start Assessment
                          </Button>
                        )}
                        {status.status === "completed" && (
                          <Button variant="outline" disabled>
                            Completed
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
