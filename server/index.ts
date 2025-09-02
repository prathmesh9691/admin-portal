import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getServerSupabase } from "./supabase";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // In-memory stores for dev
  const employees: Record<string, { id: number; employeeId: string; name: string; department: string; email?: string; createdAt: string; passwordHash?: string }> = {};
  let nextId = 1;

  // Health/test
  app.get("/api/test", (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Admin register (dev only, in-memory)
  const adminCreds: { username: string; password: string }[] = [];
  app.post("/api/admin/register", (req, res) => {
    const { username, password } = req.body ?? {};
    if (!username || !password) return res.status(400).json({ message: "username and password are required" });
    if (adminCreds.find((c) => c.username === username)) return res.status(409).json({ message: "username exists" });
    adminCreds.push({ username, password });
    res.json({ ok: true });
  });

  // Mock login (for dev only)
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body ?? {};
    const adminUser = process.env.APP_ADMIN_USERNAME || "admin";
    const adminPass = process.env.APP_ADMIN_PASSWORD || "admin123";

    const validPairs: Array<[string, string]> = [
      [adminUser, adminPass],
      ["admin@123", "Admin123"],
      ...adminCreds.map((c) => [c.username, c.password] as [string, string]),
    ];

    const ok = !!username && !!password && validPairs.some(([u, p]) => u === username && p === password);
    if (ok) return res.json({ success: true });
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  });

  // Mock generate employee id
  app.post("/api/generate-employee-id", (req, res) => {
    const { name, department, email, passwordHash } = req.body ?? {};
    if (!name || !department) return res.status(400).json({ message: "name and department are required" });
    const rand5 = Math.floor(10000 + Math.random() * 90000); // five digits
    const employeeId = `BST${rand5}`;
    const created = { id: nextId++, employeeId, name, department, email, createdAt: new Date().toISOString(), passwordHash };
    employees[employeeId] = created as any;
    res.json(created);
  });

  // Mock employee fetch
  app.get("/api/employee/:employeeId", (req, res) => {
    const emp = employees[req.params.employeeId];
    if (!emp) return res.status(404).json({ message: "Not found" });
    res.json(emp);
  });

  // Record policy read (mock)
  app.post("/api/policy-read", (req, res) => {
    const { employeeId, policyId } = req.body ?? {};
    if (!employeeId || !policyId) return res.status(400).json({ message: "employeeId and policyId are required" });
    res.json({ ok: true, readAt: new Date().toISOString() });
  });

  // Extract policies from uploaded PDF (real fetch from Supabase, AI stub)
  app.post("/api/extract-policies", async (req, res) => {
    try {
      const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ message: "Gemini API key missing" });
      const policyId = req.body?.policyId;
      if (!policyId) return res.status(400).json({ message: "policyId is required" });

      const supabase = getServerSupabase();
      const { data: pdf, error } = await supabase.from("pdf_files").select("file_name, content_base64").eq("id", policyId).maybeSingle();
      if (error || !pdf) return res.status(404).json({ message: "pdf not found" });

      // TODO: Send pdf.content_base64 to Gemini for extraction. For now, we return a structured placeholder.
      // In production, this would call Gemini API with the PDF content to extract actual policies
      const extracted = {
        policyId,
        policies: [
          { title: "Code of Conduct", content: "Employees must adhere to the company code of conduct at all times. This includes maintaining professional behavior, respecting colleagues, and following company guidelines." },
          { title: "Leave Policy", content: "Leaves must be approved by HR as per the leave policy. Employees should submit leave requests at least 3 days in advance for planned leaves." },
          { title: "Dress Code", content: "Formal attire is required from Monday to Thursday; casual Friday allowed. Dress should be appropriate for a professional work environment." },
          { title: "Working Hours", content: "Standard working hours are 9:00 AM to 6:00 PM with a 1-hour lunch break. Flexible timing may be available based on role requirements." },
          { title: "Data Security", content: "Employees must maintain data confidentiality and follow security protocols. Do not share sensitive information outside the organization." },
        ],
      };
      res.json(extracted);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Extraction error" });
    }
  });

  // Quiz generation from extracted policies (AI stub)
  app.post("/api/quiz", async (req, res) => {
    try {
      const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ message: "Gemini API key missing" });
      const policyId = req.body?.policyId;
      if (!policyId) return res.status(400).json({ message: "policyId is required" });

      // In future: fetch extracted policies from a table; for now, synthesize questions
      const quiz = {
        policyId,
        questions: [
          { q: "What is the purpose of the HR manual?", options: ["Policies and guidelines", "Entertainment", "Marketing materials", "Sales information"], answerIndex: 0 },
          { q: "Who should you contact for leave approvals?", options: ["HR Department", "CEO directly", "Security team", "Finance department"], answerIndex: 0 },
          { q: "What is the dress code policy for weekdays?", options: ["Formal attire required", "Casual wear allowed", "No dress code", "Uniform mandatory"], answerIndex: 0 },
          { q: "What are the standard working hours?", options: ["9:00 AM to 6:00 PM", "8:00 AM to 5:00 PM", "10:00 AM to 7:00 PM", "Flexible timing only"], answerIndex: 0 },
          { q: "How should employees handle sensitive data?", options: ["Maintain confidentiality", "Share with friends", "Post on social media", "Ignore security protocols"], answerIndex: 0 },
        ],
      };
      res.json(quiz);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Quiz error" });
    }
  });

  // Employee onboarding data (stub)
  app.post("/api/employee-onboarding", (req, res) => {
    const { employeeId, ...onboardingData } = req.body ?? {};
    if (!employeeId) return res.status(400).json({ message: "employeeId is required" });
    
    // In production, this would save to employee_onboarding table
    res.json({ ok: true, message: "Onboarding data received", employeeId });
  });

  // Mock upload (does not parse multipart, returns stub)
  app.post("/api/upload", (_req, res) => {
    const now = new Date().toISOString();
    res.json({ id: Date.now(), fileName: "uploaded-file", uploadedAt: now });
  });

  return app;
}
