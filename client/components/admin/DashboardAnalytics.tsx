import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";
import { 
  AssessmentAnalytics, 
  PerformanceAnalytics, 
  TrainingAnalytics, 
  ComplianceAnalytics,
  AssessmentAttempt,
  PerformanceEvaluation,
  TrainingProgress,
  Assessment
} from "@shared/api";

export default function DashboardAnalytics() {
  const [assessmentAnalytics, setAssessmentAnalytics] = useState<AssessmentAnalytics | null>(null);
  const [performanceAnalytics, setPerformanceAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [trainingAnalytics, setTrainingAnalytics] = useState<TrainingAnalytics | null>(null);
  const [complianceAnalytics, setComplianceAnalytics] = useState<ComplianceAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("30"); // days
  
  const supabase = getSupabase();

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  async function loadAnalytics() {
    if (!supabase) return;
    setLoading(true);
    try {
      await Promise.all([
        loadAssessmentAnalytics(),
        loadPerformanceAnalytics(),
        loadTrainingAnalytics(),
        loadComplianceAnalytics()
      ]);
    } catch (err: any) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  async function loadAssessmentAnalytics() {
    if (!supabase) return;
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(selectedPeriod));

      // Get assessment attempts
      const { data: attempts, error: attemptsError } = await supabase
        .from("assessment_attempts")
        .select("*, assessments(*)")
        .gte("started_at", daysAgo.toISOString());

      if (attemptsError) throw attemptsError;

      const completedAttempts = attempts?.filter(a => a.status === "completed") || [];
      const totalScore = completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
      const passedAttempts = completedAttempts.filter(a => a.passed);

      // Get top performers
      const employeeScores = new Map<string, { name: string; totalScore: number; count: number }>();
      completedAttempts.forEach(attempt => {
        const employeeId = attempt.employee_id;
        const current = employeeScores.get(employeeId) || { name: "Unknown", totalScore: 0, count: 0 };
        employeeScores.set(employeeId, {
          name: current.name,
          totalScore: current.totalScore + (attempt.score || 0),
          count: current.count + 1
        });
      });

      const topPerformers = Array.from(employeeScores.entries())
        .map(([id, data]) => ({
          employee_id: id,
          employee_name: data.name,
          average_score: data.count > 0 ? data.totalScore / data.count : 0
        }))
        .sort((a, b) => b.average_score - a.average_score)
        .slice(0, 5);

      // Get assessment type breakdown
      const typeBreakdown = new Map<string, { count: number; totalScore: number }>();
      completedAttempts.forEach(attempt => {
        const type = attempt.assessments?.type || "unknown";
        const current = typeBreakdown.get(type) || { count: 0, totalScore: 0 };
        typeBreakdown.set(type, {
          count: current.count + 1,
          totalScore: current.totalScore + (attempt.score || 0)
        });
      });

      const assessmentTypeBreakdown = Array.from(typeBreakdown.entries()).map(([type, data]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1).replace("_", " "),
        count: data.count,
        average_score: data.count > 0 ? data.totalScore / data.count : 0
      }));

      setAssessmentAnalytics({
        total_assessments: attempts?.length || 0,
        completed_assessments: completedAttempts.length,
        average_score: completedAttempts.length > 0 ? totalScore / completedAttempts.length : 0,
        pass_rate: completedAttempts.length > 0 ? (passedAttempts.length / completedAttempts.length) * 100 : 0,
        top_performers: topPerformers,
        assessment_type_breakdown: assessmentTypeBreakdown
      });
    } catch (err: any) {
      console.error("Failed to load assessment analytics:", err);
    }
  }

  async function loadPerformanceAnalytics() {
    if (!supabase) return;
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(selectedPeriod));

      const { data: evaluations, error } = await supabase
        .from("performance_evaluations")
        .select("*, employees(name, department)")
        .gte("evaluation_date", daysAgo.toISOString());

      if (error) throw error;

      if (evaluations && evaluations.length > 0) {
        const totalRating = evaluations.reduce((sum, evaluation) => sum + evaluation.overall_rating, 0);
        const averageRating = totalRating / evaluations.length;

        // Rating distribution
        const ratingDistribution = [1, 2, 3, 4, 5].map(rating => {
          const count = evaluations.filter(evaluation => evaluation.overall_rating === rating).length;
          return {
            rating,
            count,
            percentage: (count / evaluations.length) * 100
          };
        });

        // Department performance
        const deptPerformance = new Map<string, { totalRating: number; count: number }>();
        evaluations.forEach(evaluation => {
          const dept = evaluation.employees?.department || "Unknown";
          const current = deptPerformance.get(dept) || { totalRating: 0, count: 0 };
          deptPerformance.set(dept, {
            totalRating: current.totalRating + evaluation.overall_rating,
            count: current.count + 1
          });
        });

        const departmentPerformance = Array.from(deptPerformance.entries()).map(([dept, data]) => ({
          department: dept,
          average_rating: data.count > 0 ? data.totalRating / data.count : 0,
          employee_count: data.count
        }));

        setPerformanceAnalytics({
          total_evaluations: evaluations.length,
          average_rating: averageRating,
          rating_distribution: ratingDistribution,
          department_performance: departmentPerformance
        });
      }
    } catch (err: any) {
      console.error("Failed to load performance analytics:", err);
    }
  }

  async function loadTrainingAnalytics() {
    if (!supabase) return;
    try {
      const { data: modules, error: modulesError } = await supabase
        .from("training_modules")
        .select("*");

      if (modulesError) throw modulesError;

      const { data: progress, error: progressError } = await supabase
        .from("training_progress")
        .select("*, training_modules(title)");

      if (progressError) throw progressError;

      if (modules && progress) {
        const completedModules = progress.filter(p => p.status === "completed");
        const totalProgress = progress.reduce((sum, p) => sum + p.progress_percentage, 0);
        const averageProgress = progress.length > 0 ? totalProgress / progress.length : 0;

        // Overdue trainings (assuming 30 days is the standard timeframe)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const overdueTrainings = progress
          .filter(p => p.status !== "completed" && new Date(p.started_at) < thirtyDaysAgo)
          .map(p => ({
            employee_id: p.employee_id,
            employee_name: "Unknown", // Would need to join with employees table
            module_title: p.training_modules?.title || "Unknown",
            days_overdue: Math.floor((Date.now() - new Date(p.started_at).getTime()) / (1000 * 60 * 60 * 24))
          }));

        setTrainingAnalytics({
          total_modules: modules.length,
          completed_modules: completedModules.length,
          completion_rate: modules.length > 0 ? (completedModules.length / modules.length) * 100 : 0,
          average_progress: averageProgress,
          overdue_trainings: overdueTrainings
        });
      }
    } catch (err: any) {
      console.error("Failed to load training analytics:", err);
    }
  }

  async function loadComplianceAnalytics() {
    if (!supabase) return;
    try {
      const { data: quizzes, error: quizzesError } = await supabase
        .from("compliance_quizzes")
        .select("*");

      if (quizzesError) throw quizzesError;

      const { data: attempts, error: attemptsError } = await supabase
        .from("assessment_attempts")
        .select("*")
        .eq("assessment_id", quizzes?.map(q => q.id) || []);

      if (attemptsError) throw attemptsError;

      if (quizzes && attempts) {
        const completedQuizzes = attempts.filter(a => a.status === "completed");
        const passedQuizzes = attempts.filter(a => a.passed);

        // Overdue compliance (assuming due dates are set)
        const overdueCompliance = quizzes
          .filter(q => new Date(q.due_date) < new Date())
          .map(q => ({
            employee_id: "Unknown", // Would need to check against employee attempts
            employee_name: "Unknown",
            quiz_title: q.title,
            days_overdue: Math.floor((Date.now() - new Date(q.due_date).getTime()) / (1000 * 60 * 60 * 24))
          }));

        setComplianceAnalytics({
          total_quizzes: quizzes.length,
          completed_quizzes: completedQuizzes.length,
          compliance_rate: completedQuizzes.length > 0 ? (passedQuizzes.length / completedQuizzes.length) * 100 : 0,
          overdue_compliance: overdueCompliance
        });
      }
    } catch (err: any) {
      console.error("Failed to load compliance analytics:", err);
    }
  }

  const StatCard = ({ title, value, subtitle, trend }: { title: string; value: string | number; subtitle?: string; trend?: string }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {trend && (
            <Badge variant={trend.startsWith("+") ? "default" : "secondary"}>
              {trend}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dashboard Analytics</CardTitle>
              <CardDescription>Comprehensive overview of employee performance and compliance</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <Button onClick={loadAnalytics} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Assessments"
              value={assessmentAnalytics?.total_assessments || 0}
              subtitle="This period"
            />
            <StatCard
              title="Completion Rate"
              value={`${assessmentAnalytics?.pass_rate.toFixed(1) || 0}%`}
              subtitle="Assessments completed"
            />
            <StatCard
              title="Training Progress"
              value={`${trainingAnalytics?.average_progress.toFixed(1) || 0}%`}
              subtitle="Average completion"
            />
            <StatCard
              title="Compliance Rate"
              value={`${complianceAnalytics?.compliance_rate.toFixed(1) || 0}%`}
              subtitle="Quizzes passed"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Employees with highest assessment scores</CardDescription>
              </CardHeader>
              <CardContent>
                {assessmentAnalytics?.top_performers && assessmentAnalytics.top_performers.length > 0 ? (
                  <div className="space-y-3">
                    {assessmentAnalytics.top_performers.map((performer, index) => (
                      <div key={performer.employee_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{performer.employee_name}</p>
                            <p className="text-sm text-muted-foreground">ID: {performer.employee_id}</p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {performer.average_score.toFixed(1)} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No performance data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Average ratings by department</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceAnalytics?.department_performance && performanceAnalytics.department_performance.length > 0 ? (
                  <div className="space-y-3">
                    {performanceAnalytics.department_performance.map((dept) => (
                      <div key={dept.department} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{dept.department}</span>
                          <span className="text-sm text-muted-foreground">
                            {dept.average_rating.toFixed(1)}/5
                          </span>
                        </div>
                        <Progress value={(dept.average_rating / 5) * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {dept.employee_count} employees
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No department data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-6">
          {assessmentAnalytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Total Attempts"
                  value={assessmentAnalytics.total_assessments}
                  subtitle="This period"
                />
                <StatCard
                  title="Completed"
                  value={assessmentAnalytics.completed_assessments}
                  subtitle="Successfully finished"
                />
                <StatCard
                  title="Pass Rate"
                  value={`${assessmentAnalytics.pass_rate.toFixed(1)}%`}
                  subtitle="Passed assessments"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Assessment Type Breakdown</CardTitle>
                  <CardDescription>Performance by assessment category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assessmentAnalytics.assessment_type_breakdown.map((type) => (
                      <div key={type.type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{type.type}</span>
                          <span className="text-sm text-muted-foreground">
                            {type.count} attempts
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={type.average_score} 
                            className="flex-1 h-2" 
                          />
                          <span className="text-sm font-medium w-16 text-right">
                            {type.average_score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Loading assessment analytics...
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {performanceAnalytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Total Evaluations"
                  value={performanceAnalytics.total_evaluations}
                  subtitle="This period"
                />
                <StatCard
                  title="Average Rating"
                  value={performanceAnalytics.average_rating.toFixed(1)}
                  subtitle="Out of 5"
                />
                <StatCard
                  title="Departments"
                  value={performanceAnalytics.department_performance.length}
                  subtitle="Evaluated"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Rating Distribution</CardTitle>
                  <CardDescription>How ratings are distributed across the scale</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {performanceAnalytics.rating_distribution.map((rating) => (
                      <div key={rating.rating} className="flex items-center gap-3">
                        <div className="w-8 text-center font-medium">{rating.rating}</div>
                        <Progress value={rating.percentage} className="flex-1 h-3" />
                        <div className="w-16 text-right text-sm text-muted-foreground">
                          {rating.count} ({rating.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Loading performance analytics...
            </div>
          )}
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          {trainingAnalytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Total Modules"
                  value={trainingAnalytics.total_modules}
                  subtitle="Available courses"
                />
                <StatCard
                  title="Completion Rate"
                  value={`${trainingAnalytics.completion_rate.toFixed(1)}%`}
                  subtitle="Modules completed"
                />
                <StatCard
                  title="Avg Progress"
                  value={`${trainingAnalytics.average_progress.toFixed(1)}%`}
                  subtitle="Current progress"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Overdue Trainings</CardTitle>
                  <CardDescription>Employees with delayed training completion</CardDescription>
                </CardHeader>
                <CardContent>
                  {trainingAnalytics.overdue_trainings.length > 0 ? (
                    <div className="space-y-3">
                      {trainingAnalytics.overdue_trainings.map((training, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{training.employee_name}</p>
                            <p className="text-sm text-muted-foreground">{training.module_title}</p>
                          </div>
                          <Badge variant="destructive">
                            {training.days_overdue} days overdue
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-green-600">
                      ✓ All trainings are on schedule
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Loading training analytics...
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {complianceAnalytics ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Total Quizzes"
                  value={complianceAnalytics.total_quizzes}
                  subtitle="Available"
                />
                <StatCard
                  title="Completed"
                  value={complianceAnalytics.completed_quizzes}
                  subtitle="This period"
                />
                <StatCard
                  title="Compliance Rate"
                  value={`${complianceAnalytics.compliance_rate.toFixed(1)}%`}
                  subtitle="Passed quizzes"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Overdue Compliance</CardTitle>
                  <CardDescription>Employees with pending compliance requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  {complianceAnalytics.overdue_compliance.length > 0 ? (
                    <div className="space-y-3">
                      {complianceAnalytics.overdue_compliance.map((compliance, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{compliance.employee_name}</p>
                            <p className="text-sm text-muted-foreground">{compliance.quiz_title}</p>
                          </div>
                          <Badge variant="destructive">
                            {compliance.days_overdue} days overdue
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-green-600">
                      ✓ All compliance requirements are met
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Loading compliance analytics...
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
