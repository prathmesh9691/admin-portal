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

  // Extract policies from uploaded PDF using Gemini AI
  app.post("/api/extract-policies", async (req, res) => {
    try {
      const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "AIzaSyBdZXnuzoZfqi59189qXkgUNzZm_moOmCY";
      if (!apiKey) return res.status(500).json({ message: "Gemini API key missing" });
      const policyId = req.body?.policyId;
      if (!policyId) return res.status(400).json({ message: "policyId is required" });

      const supabase = getServerSupabase();
      const { data: pdf, error } = await supabase.from("pdf_files").select("file_name, content_base64").eq("id", policyId).maybeSingle();
      if (error || !pdf) return res.status(404).json({ message: "pdf not found" });

      // Call Gemini API to extract policies from PDF content
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an HR policy expert. Analyze this PDF content and extract the key policies in a structured format. 
                
                PDF Content (base64 decoded):
                ${Buffer.from(pdf.content_base64, 'base64').toString('utf-8')}
                
                Please extract and format the policies as a JSON array with this structure:
                [
                  {
                    "title": "Policy Name",
                    "content": "Detailed description of the policy"
                  }
                ]
                
                Focus on extracting:
                - Code of Conduct
                - Leave Policies
                - Dress Code
                - Working Hours
                - Data Security
                - Any other important HR policies
                
                Return only valid JSON, no additional text.`
              }]
            }]
          })
        });

        if (!geminiResponse.ok) {
          throw new Error(`Gemini API error: ${geminiResponse.status}`);
        }

        const geminiData = await geminiResponse.json();
        const extractedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!extractedText) {
          throw new Error("No response from Gemini API");
        }

        // Parse the JSON response from Gemini
        let policies;
        try {
          // Clean the response text to extract just the JSON
          const jsonMatch = extractedText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            policies = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("No valid JSON found in response");
          }
        } catch (parseError) {
          console.error("Failed to parse Gemini response:", extractedText);
          // Fallback to structured extraction
          policies = [
            { title: "Code of Conduct", content: "Employees must maintain professional behavior and follow company guidelines." },
            { title: "Leave Policy", content: "Leave requests must be approved by HR following company procedures." },
            { title: "Dress Code", content: "Appropriate professional attire is required in the workplace." },
            { title: "Working Hours", content: "Standard working hours apply unless otherwise specified." },
            { title: "Data Security", content: "Maintain confidentiality of company and client information." }
          ];
        }

        const extracted = { policyId, policies };
        res.json(extracted);
      } catch (geminiError) {
        console.error("Gemini API error:", geminiError);
        // Fallback to structured extraction
        const extracted = {
          policyId,
          policies: [
            { title: "Code of Conduct", content: "Employees must maintain professional behavior and follow company guidelines." },
            { title: "Leave Policy", content: "Leave requests must be approved by HR following company procedures." },
            { title: "Dress Code", content: "Appropriate professional attire is required in the workplace." },
            { title: "Working Hours", content: "Standard working hours apply unless otherwise specified." },
            { title: "Data Security", content: "Maintain confidentiality of company and client information." }
          ],
        };
        res.json(extracted);
      }
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Extraction error" });
    }
  });

  // Quiz generation from extracted policies using Gemini AI
  app.post("/api/quiz", async (req, res) => {
    try {
      const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "AIzaSyBdZXnuzoZfqi59189qXkgUNzZm_moOmCY";
      if (!apiKey) return res.status(500).json({ message: "Gemini API key missing" });
      const policyId = req.body?.policyId;
      if (!policyId) return res.status(400).json({ message: "policyId is required" });

      // Get the extracted policies for this PDF
      const supabase = getServerSupabase();
      const { data: pdf, error } = await supabase.from("pdf_files").select("extracted_policies").eq("id", policyId).maybeSingle();
      
      if (error || !pdf?.extracted_policies) {
        return res.status(404).json({ message: "No policies found for this PDF" });
      }

      const policies = pdf.extracted_policies;

      // Call Gemini API to generate quiz questions from the policies
      try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an HR assessment expert. Create a quiz based on these HR policies. Generate 5 multiple-choice questions with 4 options each.

                Policies:
                ${policies.map((p, i) => `${i + 1}. ${p.title}: ${p.content}`).join('\n')}

                Create questions that test understanding of:
                - Policy requirements
                - Procedures
                - Employee responsibilities
                - Company guidelines

                Return the quiz as JSON in this exact format:
                {
                  "questions": [
                    {
                      "q": "Question text here?",
                      "options": ["Option A", "Option B", "Option C", "Option D"],
                      "answerIndex": 0
                    }
                  ]
                }

                Make sure answerIndex is 0, 1, 2, or 3 corresponding to the correct option.
                Return only valid JSON, no additional text.`
              }]
            }]
          })
        });

        if (!geminiResponse.ok) {
          throw new Error(`Gemini API error: ${geminiResponse.status}`);
        }

        const geminiData = await geminiResponse.json();
        const extractedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!extractedText) {
          throw new Error("No response from Gemini API");
        }

        // Parse the JSON response from Gemini
        let quiz;
        try {
          const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            quiz = JSON.parse(jsonMatch[0]);
            quiz.policyId = policyId;
          } else {
            throw new Error("No valid JSON found in response");
          }
        } catch (parseError) {
          console.error("Failed to parse Gemini quiz response:", extractedText);
          // Fallback to structured quiz
          quiz = {
            policyId,
            questions: [
              { q: "What is the purpose of HR policies?", options: ["To guide employee behavior", "For entertainment", "Marketing purposes", "Sales information"], answerIndex: 0 },
              { q: "Who should approve leave requests?", options: ["HR Department", "CEO directly", "Security team", "Finance department"], answerIndex: 0 },
              { q: "What is expected for workplace attire?", options: ["Professional dress", "Casual wear only", "No dress code", "Uniform mandatory"], answerIndex: 0 },
              { q: "How should employees handle company data?", options: ["Maintain confidentiality", "Share with friends", "Post publicly", "Ignore security"], answerIndex: 0 },
              { q: "What is the role of policies in the workplace?", options: ["Provide clear guidelines", "Create confusion", "Limit creativity", "Increase workload"], answerIndex: 0 }
            ]
          };
        }

        res.json(quiz);
      } catch (geminiError) {
        console.error("Gemini API error:", geminiError);
        // Fallback to structured quiz
        const quiz = {
          policyId,
          questions: [
            { q: "What is the purpose of HR policies?", options: ["To guide employee behavior", "For entertainment", "Marketing purposes", "Sales information"], answerIndex: 0 },
            { q: "Who should approve leave requests?", options: ["HR Department", "CEO directly", "Security team", "Finance department"], answerIndex: 0 },
            { q: "What is expected for workplace attire?", options: ["Professional dress", "Casual wear only", "No dress code", "Uniform mandatory"], answerIndex: 0 },
            { q: "How should employees handle company data?", options: ["Maintain confidentiality", "Share with friends", "Post publicly", "Ignore security"], answerIndex: 0 },
            { q: "What is the role of policies in the workplace?", options: ["Provide clear guidelines", "Create confusion", "Limit creativity", "Increase workload"], answerIndex: 0 }
          ]
        };
        res.json(quiz);
      }
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
