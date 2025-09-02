import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiJson } from "@/lib/api";
import type { LoginRequest, LoginResponse } from "@shared/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<LoginRequest>({ username: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiJson<LoginResponse>("/login", { method: "POST", body: form });
      if (res.success) {
        localStorage.setItem("pulsehr_admin", "true");
        toast.success("Login successful");
        navigate("/admin/dashboard");
      } else {
        toast.error(res.message || "Invalid credentials");
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Sign in to access the Admin Dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
