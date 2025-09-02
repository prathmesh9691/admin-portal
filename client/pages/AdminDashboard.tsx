import UploadSection from "@/components/admin/UploadSection";
import EmployeeIdGenerator from "@/components/admin/EmployeeIdGenerator";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    const authed = localStorage.getItem("pulsehr_admin");
    if (!authed) navigate("/admin/login");
  }, [navigate]);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <UploadSection />
        <EmployeeIdGenerator />
      </div>
    </div>
  );
}
