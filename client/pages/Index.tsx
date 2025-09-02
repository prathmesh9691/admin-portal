import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function Index() {
  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(90%_60%_at_20%_10%,hsl(var(--primary)/0.25),transparent),radial-gradient(80%_60%_at_80%_20%,theme(colors.orange.500/.25),transparent)]" />
      <div className="container max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid gap-10 md:gap-16 items-center md:grid-cols-2">
          <div>
            <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground">Modern HR Portal</span>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              AI-powered HR manual processing and employee onboarding
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-prose">
              Upload HR manuals, auto-extract policies with AI, generate employee credentials, and assess policy understanding—all in one place.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link to="/admin/login">Admin Login</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/employee">Employee Portal</Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-background to-secondary/30 border-primary/10">
              <CardHeader>
                <CardTitle>AI Policy Extraction</CardTitle>
                <CardDescription>Summarized policies from your manuals</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Preview extracted policies before publishing.</CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-background to-secondary/30 border-primary/10">
              <CardHeader>
                <CardTitle>Employee Onboarding</CardTitle>
                <CardDescription>Complete profile setup</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Multi-section form with document uploads.</CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
