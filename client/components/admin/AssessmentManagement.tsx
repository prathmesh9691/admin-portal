import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";
import { Assessment, AssessmentQuestion } from "@shared/api";

export default function AssessmentManagement() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  
  const supabase = getSupabase();

  useEffect(() => {
    loadAssessments();
  }, []);

  async function loadAssessments() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setAssessments(data || []);
    } catch (err: any) {
      toast.error("Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestions(assessmentId: string) {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("assessment_questions")
        .select("*")
        .eq("assessment_id", assessmentId)
        .order("order_index");
      
      if (error) throw error;
      setQuestions(data || []);
    } catch (err: any) {
      toast.error("Failed to load questions");
    }
  }

  async function createAssessment(formData: FormData) {
    if (!supabase) return;
    try {
      const assessmentData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        type: formData.get("type") as Assessment["type"],
        category: formData.get("category") as string,
        duration_minutes: parseInt(formData.get("duration_minutes") as string),
        passing_score: parseInt(formData.get("passing_score") as string),
        total_questions: parseInt(formData.get("total_questions") as string),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("assessments")
        .insert(assessmentData)
        .select()
        .single();

      if (error) throw error;

      toast.success("Assessment created successfully!");
      setShowCreateForm(false);
      loadAssessments();
    } catch (err: any) {
      toast.error(err.message || "Failed to create assessment");
    }
  }

  async function createQuestion(formData: FormData) {
    if (!supabase || !selectedAssessment) return;
    try {
      const questionData = {
        assessment_id: selectedAssessment.id,
        question_text: formData.get("question_text") as string,
        question_type: formData.get("question_type") as AssessmentQuestion["question_type"],
        options: formData.get("options") ? (formData.get("options") as string).split(",").map(s => s.trim()) : undefined,
        correct_answer: formData.get("correct_answer") as string,
        max_score: parseInt(formData.get("max_score") as string),
        order_index: questions.length + 1,
      };

      const { error } = await supabase
        .from("assessment_questions")
        .insert(questionData);

      if (error) throw error;

      toast.success("Question added successfully!");
      setShowQuestionForm(false);
      loadQuestions(selectedAssessment.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to add question");
    }
  }

  async function toggleAssessmentStatus(assessment: Assessment) {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("assessments")
        .update({ 
          is_active: !assessment.is_active,
          updated_at: new Date().toISOString()
        })
        .eq("id", assessment.id);

      if (error) throw error;

      toast.success(`Assessment ${assessment.is_active ? 'deactivated' : 'activated'} successfully!`);
      loadAssessments();
    } catch (err: any) {
      toast.error(err.message || "Failed to update assessment");
    }
  }

  async function deleteAssessment(assessmentId: string) {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from("assessments")
        .delete()
        .eq("id", assessmentId);

      if (error) throw error;

      toast.success("Assessment deleted successfully!");
      loadAssessments();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete assessment");
    }
  }

  const assessmentTypes = [
    { value: "skills", label: "Skills Assessment" },
    { value: "performance", label: "Performance Evaluation" },
    { value: "training", label: "Training Completion" },
    { value: "compliance", label: "Compliance Quiz" },
    { value: "360_feedback", label: "360° Feedback" },
  ];

  const questionTypes = [
    { value: "mcq", label: "Multiple Choice" },
    { value: "essay", label: "Essay" },
    { value: "rating_scale", label: "Rating Scale" },
    { value: "true_false", label: "True/False" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assessment Management</CardTitle>
              <CardDescription>Create and manage employee assessments</CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              Create Assessment
            </Button>
          </div>
        </CardHeader>
      </Card>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); createAssessment(new FormData(e.currentTarget)); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Assessment Title *</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Assessment Type *</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {assessmentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" placeholder="e.g., Technical, Soft Skills" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
                  <Input id="duration_minutes" name="duration_minutes" type="number" min="1" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passing_score">Passing Score (%) *</Label>
                  <Input id="passing_score" name="passing_score" type="number" min="0" max="100" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_questions">Total Questions *</Label>
                  <Input id="total_questions" name="total_questions" type="number" min="1" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Assessment</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="assessments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8">Loading assessments...</div>
              ) : assessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No assessments created yet
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.map((assessment) => (
                    <div key={assessment.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{assessment.title}</h3>
                            <Badge variant={assessment.is_active ? "default" : "secondary"}>
                              {assessment.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{assessment.type}</Badge>
                          </div>
                          <p className="text-muted-foreground mb-2">{assessment.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Category:</span> {assessment.category}
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span> {assessment.duration_minutes} min
                            </div>
                            <div>
                              <span className="font-medium">Passing Score:</span> {assessment.passing_score}%
                            </div>
                            <div>
                              <span className="font-medium">Questions:</span> {assessment.total_questions}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAssessment(assessment);
                              loadQuestions(assessment.id);
                            }}
                          >
                            Manage Questions
                          </Button>
                          <Button
                            size="sm"
                            variant={assessment.is_active ? "secondary" : "default"}
                            onClick={() => toggleAssessmentStatus(assessment)}
                          >
                            {assessment.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteAssessment(assessment.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          {selectedAssessment ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Questions for: {selectedAssessment.title}</CardTitle>
                    <CardDescription>Manage assessment questions</CardDescription>
                  </div>
                  <Button onClick={() => setShowQuestionForm(true)}>
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showQuestionForm && (
                  <div className="mb-6 p-4 border rounded-lg">
                    <form onSubmit={(e) => { e.preventDefault(); createQuestion(new FormData(e.currentTarget)); }} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="question_text">Question Text *</Label>
                          <Textarea id="question_text" name="question_text" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="question_type">Question Type *</Label>
                          <Select name="question_type" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {questionTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max_score">Max Score *</Label>
                          <Input id="max_score" name="max_score" type="number" min="1" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="correct_answer">Correct Answer</Label>
                          <Input id="correct_answer" name="correct_answer" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="options">Options (comma-separated for MCQ)</Label>
                        <Input id="options" name="options" placeholder="Option 1, Option 2, Option 3" />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Add Question</Button>
                        <Button type="button" variant="outline" onClick={() => setShowQuestionForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">Q{index + 1}:</span>
                            <Badge variant="outline">{question.question_type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              Max Score: {question.max_score}
                            </span>
                          </div>
                          <p className="mb-2">{question.question_text}</p>
                          {question.options && question.options.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Options:</span> {question.options.join(", ")}
                            </div>
                          )}
                          {question.correct_answer && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Correct Answer:</span> {question.correct_answer}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  Select an assessment to manage its questions
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
