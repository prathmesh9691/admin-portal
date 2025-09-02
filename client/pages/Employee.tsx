import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";

export default function EmployeePage() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionEmp, setSessionEmp] = useState<{ id: string; employee_id: string; name: string } | null>(null);
  const [policies, setPolicies] = useState<Array<{ id: string; file_name: string; uploaded_at: string }>>([]);
  const [quiz, setQuiz] = useState<{ policyId: string; questions: Array<{ q: string; options: string[]; answerIndex: number }> } | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const supabase = useMemo(() => getSupabase(), []);

  async function sha256Hex(input: string): Promise<string> {
    const enc = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return toast.error("Supabase not configured");
    setLoading(true);
    try {
      const enteredId = employeeId.trim();
      const enteredPass = password.trim();
      if (!enteredId || !enteredPass) throw new Error("Enter ID and password");
      const ph = await sha256Hex(enteredPass);
      const { data, error } = await supabase
        .from("employees")
        .select("id, employee_id, name, password_hash")
        .eq("employee_id", enteredId)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Employee ID not found");
      if ((data.password_hash || "") !== ph) throw new Error("Invalid credentials");
      setSessionEmp({ id: data.id, employee_id: data.employee_id, name: data.name });
      localStorage.setItem("pulsehr_employee", JSON.stringify({ id: data.id, employee_id: data.employee_id, name: data.name }));
      await loadPolicies();
      toast.success("Logged in");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadPolicies() {
    if (!supabase) return;
    const { data, error } = await supabase.from("pdf_files").select("id, file_name, uploaded_at").order("uploaded_at", { ascending: false });
    if (error) return toast.error(error.message);
    setPolicies((data || []).map((d: any) => ({ id: d.id, file_name: d.file_name, uploaded_at: d.uploaded_at })));
  }

  async function acknowledgePolicy(policyId: string) {
    if (!supabase || !sessionEmp) return;
    const { error } = await supabase.from("policy_reads").insert({ employee_id: sessionEmp.id, policy_id: policyId, read_at: new Date().toISOString() });
    if (error) return toast.error(error.message);
    toast.success("Acknowledged");
  }

  function logout() {
    setSessionEmp(null);
    localStorage.removeItem("pulsehr_employee");
  }

  async function startAssessment(policyId: string) {
    try {
      toast.message("Generating questions...");
      const res = await fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ policyId }) });
      if (!res.ok) throw new Error("Failed to generate quiz");
      const quiz = await res.json();
      localStorage.setItem("pulsehr_quiz", JSON.stringify(quiz));
      window.location.href = `/employee?quiz=${encodeURIComponent(policyId)}`; // simple navigation (reuse page or future route)
    } catch (e: any) {
      toast.error(e.message || "Quiz failed");
    }
  }

  useEffect(() => {
    // Restore employee session
    const raw = localStorage.getItem("pulsehr_employee");
    if (raw) {
      try {
        const emp = JSON.parse(raw);
        if (emp?.id) setSessionEmp(emp);
      } catch {}
    }
    // Load policies on mount if session exists
    // handled by separate effect
  }, []);

  useEffect(() => {
    if (sessionEmp) {
      loadPolicies();
    }
  }, [sessionEmp]);

  useEffect(() => {
    // Restore quiz if present
    const rawQuiz = localStorage.getItem("pulsehr_quiz");
    if (rawQuiz) {
      try {
        const qz = JSON.parse(rawQuiz);
        if (qz?.questions?.length) setQuiz(qz);
      } catch {}
    }
  }, []);

  function selectAnswer(questionIndex: number, optionIndex: number) {
    setAnswers((a) => ({ ...a, [questionIndex]: optionIndex }));
  }

  function submitQuiz() {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.answerIndex) correct++;
    });
    setScore(correct);
    toast.success(`Scored ${correct}/${quiz.questions.length}`);
  }

  function clearQuiz() {
    setQuiz(null);
    setAnswers({});
    setScore(null);
    localStorage.removeItem("pulsehr_quiz");
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
      <div className="max-w-2xl mx-auto">
        {!sessionEmp ? (
          <Card>
            <CardHeader>
              <CardTitle>Employee Login</CardTitle>
              <CardDescription>Use your ID and password provided by admin</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input id="employeeId" placeholder="BST12345" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
              </form>
            </CardContent>
          </Card>
        ) : quiz ? (
          <Card>
            <CardHeader>
              <CardTitle>Assessment</CardTitle>
              <CardDescription>Answer the questions below</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quiz.questions.map((q, qi) => (
                  <div key={qi} className="border rounded-md p-3">
                    <div className="font-medium mb-2">Q{qi + 1}. {q.q}</div>
                    <div className="grid gap-2">
                      {q.options.map((opt, oi) => (
                        <label key={oi} className={`flex items-center gap-2 cursor-pointer ${answers[qi] === oi ? "text-primary" : ""}`}>
                          <input
                            type="radio"
                            name={`q-${qi}`}
                            checked={answers[qi] === oi}
                            onChange={() => selectAnswer(qi, oi)}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Button onClick={submitQuiz}>Submit</Button>
                  <Button variant="secondary" onClick={clearQuiz}>Cancel</Button>
                </div>
                {score !== null && (
                  <div className="mt-2 text-sm">Your score: {score}/{quiz.questions.length}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Welcome, {sessionEmp.name}</h2>
              <Button variant="secondary" onClick={logout}>Logout</Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Policies</CardTitle>
                <CardDescription>Read and acknowledge each policy, then take the assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {policies.length === 0 && (
                    <div className="text-sm text-muted-foreground">No policies uploaded yet.</div>
                  )}
                  {policies.map((p) => (
                    <div key={p.id} className="border rounded-md p-3">
                      <div className="font-medium">{p.file_name}</div>
                      <div className="text-xs text-muted-foreground mb-2">Uploaded {new Date(p.uploaded_at).toLocaleString()}</div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => acknowledgePolicy(p.id)}>I have read this</Button>
                        <Button size="sm" variant="outline" onClick={() => startAssessment(p.id)}>Start Assessment</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
