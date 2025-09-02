import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // In-memory stores for dev
  const employees: Record<string, { id: number; employeeId: string; name: string; department: string; email?: string; createdAt: string }> = {};
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

  // Mock login (for dev only)
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body ?? {};
    const adminUser = process.env.APP_ADMIN_USERNAME || "admin";
    const adminPass = process.env.APP_ADMIN_PASSWORD || "admin123";

    const validPairs: Array<[string, string]> = [
      [adminUser, adminPass],
      ["admin@123", "Admin123"],
    ];

    const ok = !!username && !!password && validPairs.some(([u, p]) => u === username && p === password);
    if (ok) return res.json({ success: true });
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  });

  // Mock generate employee id
  app.post("/api/generate-employee-id", (req, res) => {
    const { name, department, email } = req.body ?? {};
    if (!name || !department) return res.status(400).json({ message: "name and department are required" });
    const rand5 = Math.floor(10000 + Math.random() * 90000); // five digits
    const employeeId = `BST${rand5}`;
    const created = { id: nextId++, employeeId, name, department, email, createdAt: new Date().toISOString() };
    employees[employeeId] = created as any;
    res.json(created);
  });

  // Mock employee fetch
  app.get("/api/employee/:employeeId", (req, res) => {
    const emp = employees[req.params.employeeId];
    if (!emp) return res.status(404).json({ message: "Not found" });
    res.json(emp);
  });

  // Mock upload (does not parse multipart, returns stub)
  app.post("/api/upload", (_req, res) => {
    const now = new Date().toISOString();
    res.json({ id: Date.now(), fileName: "uploaded-file", uploadedAt: now });
  });

  return app;
}
