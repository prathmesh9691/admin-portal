import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getServerSupabase } from "./supabase";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  // Increase body size limits to support ~50MB PDF uploads (base64 overhead accounted)
  app.use(express.json({ limit: '75mb' }));
  app.use(express.urlencoded({ extended: true, limit: '75mb' }));

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
      const { data: pdf, error } = await supabase.from("pdf_files").select("file_name, content_base64, category_id").eq("id", policyId).maybeSingle();
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
        try {
          // Persist into extracted_policies table as one row per policy
          const rows = policies.map((p: any) => ({
            pdf_id: policyId,
            category_id: pdf.category_id ?? null,
            policy_title: String(p.title ?? "Untitled"),
            policy_content: String(p.content ?? "")
          }));
          if (rows.length > 0) {
            const { error: insertErr } = await supabase.from("extracted_policies").insert(rows);
            if (insertErr) console.error("Failed to insert extracted_policies:", insertErr);
          }
        } catch (persistErr) {
          console.error("Persist extracted_policies error:", persistErr);
        }
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
        try {
          const rows = extracted.policies.map((p: any) => ({
            pdf_id: policyId,
            category_id: pdf.category_id ?? null,
            policy_title: String(p.title ?? "Untitled"),
            policy_content: String(p.content ?? "")
          }));
          if (rows.length > 0) {
            const { error: insertErr } = await supabase.from("extracted_policies").insert(rows);
            if (insertErr) console.error("Failed to insert extracted_policies (fallback):", insertErr);
          }
        } catch (persistErr) {
          console.error("Persist extracted_policies error (fallback):", persistErr);
        }
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

  // Get HR manual categories
  app.get("/api/hr-categories", async (_req, res) => {
    try {
      const supabase = getServerSupabase();
      const { data, error } = await supabase
        .from("hr_manual_categories")
        .select("*")
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      res.json(data || []);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to fetch categories" });
    }
  });

  // Ensure HR categories exist (idempotent upsert)
  app.post("/api/hr-categories/ensure", async (_req, res) => {
    try {
      const supabase = getServerSupabase();
      const categories = [
        { name: "Company Description", description: "Company overview shown to employees on first login", order_index: 0 },
        { name: "Policy Organization Chart", description: "Organizational structure and policy hierarchy", order_index: 1 },
        { name: "Recruitment Policy", description: "Guidelines for hiring and recruitment processes", order_index: 2 },
        { name: "Joining Onboarding Process", description: "Employee onboarding procedures and requirements", order_index: 3 },
        { name: "Probation Period & Confirmation Policy", description: "Probation period guidelines and confirmation process", order_index: 4 },
        { name: "Code of Conduct", description: "Company code of conduct and ethical guidelines", order_index: 5 },
        { name: "Work Hours, Attendance, Public Holidays & Leave Policy", description: "Working hours, attendance tracking, and leave policies", order_index: 6 },
        { name: "IT & Data Security Policy", description: "Information technology and data security guidelines", order_index: 7 },
        { name: "WorkPlace Conduct & Disciplinary Policy", description: "Workplace behavior and disciplinary procedures", order_index: 8 },
        { name: "Work From Home (WFH) Guidelines", description: "Remote work policies and guidelines", order_index: 9 },
        { name: "Company Assets Policy", description: "Management and usage of company assets", order_index: 10 },
        { name: "Project Backout Policy", description: "Project withdrawal and backout procedures", order_index: 11 },
        { name: "Bench Resources Policy", description: "Management of bench resources and utilization", order_index: 12 },
        { name: "Training & Development Policy", description: "Employee training and development programs", order_index: 13 },
        { name: "Performance Appraisal/ Reward & Recognition & PMS", description: "Performance management and recognition systems", order_index: 14 },
        { name: "Exit Policy", description: "Employee exit procedures and offboarding", order_index: 15 },
      ];

      // Upsert by name
      const { error } = await supabase
        .from("hr_manual_categories")
        .upsert(categories, { onConflict: "name" });

      if (error) throw error;
      const { data } = await supabase
        .from("hr_manual_categories")
        .select("*")
        .order("order_index", { ascending: true });
      res.json(data || []);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to ensure categories" });
    }
  });

  // Upload HR manual for specific category
  app.post("/api/upload-hr-manual", async (req, res) => {
    try {
      const { fileName, mimeType, sizeBytes, contentBase64, categoryId } = req.body;
      
      if (!fileName || !contentBase64 || !categoryId) {
        return res.status(400).json({ message: "fileName, contentBase64, and categoryId are required" });
      }

      // Validate size <= 50MB (binary). Base64 adds ~33% overhead.
      const MAX_BYTES = 50 * 1024 * 1024; // 50MB
      const b64 = String(contentBase64);
      // Approximate decoded bytes from base64 length
      const padding = (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
      const approxBytes = Math.floor((b64.length * 3) / 4) - padding;
      if (approxBytes > MAX_BYTES) {
        return res.status(413).json({ message: `File too large. Max 50MB; received ~${(approxBytes / (1024*1024)).toFixed(2)}MB` });
      }

      const supabase = getServerSupabase();
      const { data, error } = await supabase
        .from("pdf_files")
        .insert({
          file_name: fileName,
          mime_type: mimeType || "application/pdf",
          size_bytes: sizeBytes ?? approxBytes,
          content_base64: contentBase64,
          category_id: categoryId,
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error (pdf_files):", error);
        throw error;
      }
      res.json(data);
    } catch (e: any) {
      console.error("Upload failed:", e);
      res.status(e?.status || 500).json({ message: e.message || "Upload failed" });
    }
  });

  // Get HR manuals by category (latest first)
  app.get("/api/hr-manuals/:categoryId", async (req, res) => {
    try {
      const { categoryId } = req.params;
      const supabase = getServerSupabase();
      
      const { data, error } = await supabase
        .from("pdf_files")
        .select("id, file_name, mime_type, size_bytes, uploaded_at, extracted_policies, category_id")
        .eq("category_id", categoryId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      res.json(data || []);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to fetch manuals" });
    }
  });

  // Get all HR manuals (latest first)
  app.get("/api/hr-manuals", async (_req, res) => {
    try {
      const supabase = getServerSupabase();
      
      const { data, error } = await supabase
        .from("pdf_files")
        .select("id, file_name, mime_type, size_bytes, uploaded_at, extracted_policies, category_id")
        .not("category_id", "is", null)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      res.json(data || []);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to fetch manuals" });
    }
  });

  // Download HR manual
  app.get("/api/hr-manual/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      const supabase = getServerSupabase();
      
      const { data, error } = await supabase
        .from("pdf_files")
        .select("file_name, content_base64, mime_type")
        .eq("id", id)
        .single();

      if (error || !data) {
        return res.status(404).json({ message: "Manual not found" });
      }

      const buffer = Buffer.from(data.content_base64, 'base64');
      res.setHeader('Content-Type', data.mime_type || 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${data.file_name}"`);
      res.send(buffer);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Download failed" });
    }
  });

  return app;
}
