import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function BDDashboard() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-[#0b1220] border-r border-white/10 min-h-screen p-4">
          <div className="font-bold mb-4">BST</div>
          <nav className="space-y-2 text-sm">
            {[
              "Home","Clients","Projects","Invoice Editor","Invoice Management","Expenses","Daily Logs","Directory","Timesheet Management"
            ].map((item) => (
              <div key={item} className="px-3 py-2 rounded hover:bg-white/5 cursor-pointer">{item}</div>
            ))}
          </nav>
        </aside>
        {/* Main */}
        <main className="flex-1 p-6 space-y-6">
          <Card className="bg-[#0b1220] border-white/10">
            <CardHeader>
              <CardTitle className="text-xl">Welcome to Your Accounting Dashboard</CardTitle>
              <CardDescription className="text-white/60">Comprehensive overview of your business finances and performance</CardDescription>
            </CardHeader>
          </Card>

          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: "Total Revenue", value: "₹3,92,704", color: "text-emerald-400" },
              { title: "Total Expenses", value: "₹3,57,000", color: "text-rose-400" },
              { title: "Net Profit", value: "₹35,704", color: "text-sky-400" },
              { title: "Outstanding", value: "₹2,03,904", color: "text-yellow-300" },
            ].map((kpi) => (
              <Card key={kpi.title} className="bg-[#0b1220] border-white/10">
                <CardContent className="p-5">
                  <div className="text-sm text-white/60">{kpi.title}</div>
                  <div className={`text-2xl font-semibold ${kpi.color}`}>{kpi.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Secondary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {["Total Clients","Active Projects","Total Invoices","Pending Invoices"].map((t) => (
              <Card key={t} className="bg-[#0b1220] border-white/10 h-24" />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#0b1220] border-white/10 h-64" />
            <Card className="bg-[#0b1220] border-white/10 h-64" />
          </div>

          <Card className="bg-[#0b1220] border-white/10 h-64" />
        </main>
      </div>
    </div>
  );
}


