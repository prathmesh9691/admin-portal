import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function Index() {
  return (
    <section className="relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(90%_60%_at_20%_10%,hsl(var(--primary)/0.25),transparent),radial-gradient(80%_60%_at_80%_20%,theme(colors.purple.500/.25),transparent)]" />
      <div className="container max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid gap-10 md:gap-16 items-center md:grid-cols-2">
          <div>
            <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground">Modern HR Portal</span>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Secure Admin tools and effortless Employee access
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-prose">
              PulseHR streamlines document management and employee ID generation with a delightful, mobile-first experience.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link to="/admin/login">Admin</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/employee">Employee</Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-background to-secondary/30 border-primary/10">
              <CardHeader>
                <CardTitle>Upload Manuals</CardTitle>
                <CardDescription>HR Manuals, CODs, and more</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Secure storage with metadata tracking.</CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-background to-secondary/30 border-primary/10">
              <CardHeader>
                <CardTitle>Generate IDs</CardTitle>
                <CardDescription>BST + 5 digits (e.g., BST20351)</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Unique IDs for every employee.</CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
