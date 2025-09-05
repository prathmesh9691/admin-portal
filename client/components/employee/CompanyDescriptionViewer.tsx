import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CompanyDescriptionViewerProps {
  onComplete: () => void;
}

interface Category {
  id: string;
  name: string;
}

interface ManualRow {
  id: string;
  file_name: string;
  content_base64?: string;
}

export default function CompanyDescriptionViewer({ onComplete }: CompanyDescriptionViewerProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [manual, setManual] = useState<ManualRow | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyDescription();
  }, []);

  async function loadCompanyDescription() {
    try {
      setLoading(true);
      // 1) Fetch categories and find Company Description
      const resCat = await fetch("/api/hr-categories");
      if (!resCat.ok) throw new Error("Failed to load categories");
      const cats: Category[] = await resCat.json();
      const companyCat = cats.find((c) => c.name.toLowerCase() === "company description");
      if (!companyCat) {
        setLoading(false);
        return;
      }
      setCategory(companyCat);

      // 2) Fetch latest manual in this category
      const resManuals = await fetch(`/api/hr-manuals/${companyCat.id}`);
      if (!resManuals.ok) throw new Error("Failed to load company description");
      const manuals = await resManuals.json();
      if (!manuals || manuals.length === 0) {
        setLoading(false);
        return;
      }
      const latest = manuals[0];
      setManual(latest);

      // 3) Download PDF as blob, convert to object URL for iframe viewing
      const resDownload = await fetch(`/api/hr-manual/${latest.id}/download`);
      if (!resDownload.ok) throw new Error("Failed to fetch PDF");
      const blob = await resDownload.blob();
      const url = URL.createObjectURL(blob);

      // For simple pagination UX, we render the PDF in an <iframe> and paginate by page number param
      // Modern browsers' built-in viewers accept #page=N; we simulate 4 pages as requested.
      const generatedPages = ["#page=1", "#page=2", "#page=3", "#page=4"].map((hash) => `${url}${hash}`);
      setPages(generatedPages);
    } catch (e: any) {
      toast.error(e.message || "Failed to load company description");
    } finally {
      setLoading(false);
    }
  }

  const canPrev = pageIndex > 0;
  const canNext = pageIndex < Math.max(pages.length - 1, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Description</CardTitle>
        <CardDescription>Read the 4-page company overview before onboarding</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : !manual || pages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Company description not uploaded by admin yet.</div>
        ) : (
          <div className="space-y-4">
            <div className="aspect-[1/1.414] w-full border rounded overflow-hidden bg-white">
              <iframe
                title="Company Description"
                src={pages[Math.min(pageIndex, pages.length - 1)]}
                className="w-full h-[70vh]"
              />
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setPageIndex((i) => Math.max(0, i - 1))} disabled={!canPrev}>Previous</Button>
              <div className="text-sm text-muted-foreground">Page {pageIndex + 1} of 4</div>
              {canNext ? (
                <Button onClick={() => setPageIndex((i) => Math.min(3, i + 1))}>Next</Button>
              ) : (
                <Button onClick={onComplete}>Proceed to Onboarding</Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


