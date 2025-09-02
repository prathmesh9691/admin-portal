import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Header() {
  const location = useLocation();
  const onDashboard = location.pathname.startsWith("/admin");
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
      <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-purple-600 text-white font-bold">B</span>
          <span className="text-lg font-extrabold tracking-tight">BST-HR</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant={onDashboard ? "secondary" : "ghost"}>
            <Link to="/admin/login">Admin</Link>
          </Button>
          <Button asChild variant={!onDashboard ? "secondary" : "ghost"}>
            <Link to="/employee">Employee</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
