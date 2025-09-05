import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface HRManualReaderProps {
  onComplete: () => void;
}

interface Category {
  id: string;
  name: string;
  order_index: number;
}

interface ManualRow {
  id: string;
  file_name: string;
}

export default function HRManualReader({ onComplete }: HRManualReaderProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentManual, setCurrentManual] = useState<ManualRow | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      loadManual(categories[currentIndex]?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, currentIndex]);

  async function loadCategories() {
    try {
      setLoading(true);
      const res = await fetch("/api/hr-categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const all = await res.json();
      // Exclude Company Description; only read 15 policy sections
      const filtered = all.filter((c: Category) => c.name.toLowerCase() !== "company description").sort((a: Category, b: Category) => a.order_index - b.order_index);
      setCategories(filtered);
    } catch (e: any) {
      toast.error(e.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  async function loadManual(categoryId?: string) {
    if (!categoryId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/hr-manuals/${categoryId}`);
      if (!res.ok) {
        setCurrentManual(null);
        setPdfUrl(null);
        return;
      }
      const manuals: ManualRow[] = await res.json();
      if (!manuals || manuals.length === 0) {
        setCurrentManual(null);
        setPdfUrl(null);
        return;
      }
      const latest = manuals[0];
      setCurrentManual(latest);
      const resDownload = await fetch(`/api/hr-manual/${latest.id}/download`);
      if (!resDownload.ok) throw new Error("Failed to download PDF");
      const blob = await resDownload.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(`${url}#page=1`);
    } catch (e: any) {
      toast.error(e.message || "Failed to load manual");
    } finally {
      setLoading(false);
    }
  }

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < Math.max(categories.length - 1, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>HR Manuals & Policies</CardTitle>
        <CardDescription>Read each section; proceed to assessment after the last section</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">HR manuals not uploaded by admin.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{categories[currentIndex]?.name || "Section"}</div>
              <div className="text-sm text-muted-foreground">{currentIndex + 1} / {categories.length}</div>
            </div>
            <div className="aspect-[1/1.414] w-full border rounded overflow-hidden bg-white">
              {pdfUrl ? (
                <iframe title="HR Manual" src={pdfUrl} className="w-full h-[70vh]" />
              ) : (
                <div className="w-full h-[70vh] flex items-center justify-center text-muted-foreground">No file uploaded for this section</div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={!canPrev}>Previous</Button>
              {canNext ? (
                <Button onClick={() => setCurrentIndex((i) => Math.min(categories.length - 1, i + 1))}>Next</Button>
              ) : (
                <Button onClick={onComplete}>Go to Assessment</Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


