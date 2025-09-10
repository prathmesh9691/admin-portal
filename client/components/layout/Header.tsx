import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Header() {
  const location = useLocation();
  const onDashboard = location.pathname.startsWith("/admin");
  const onEmployee = location.pathname.startsWith("/employee");
  
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
      <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Brandsmashers Technology"
            className="h-8 w-8 rounded-sm object-contain"
          />
          <span className="text-lg font-extrabold tracking-tight">Brandsmashers Tech</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant={onDashboard ? "secondary" : "ghost"}>
            <Link to="/admin">Admin Dashboard</Link>
          </Button>
          <Button asChild variant={onEmployee ? "secondary" : "ghost"}>
            <Link to="/employee">Employee Portal</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
