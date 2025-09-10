import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CompanyDescriptionPage {
  id: string;
  page_number: number;
  title: string;
  content_base64: string;
  file_name: string;
}

interface CompanyDescriptionPagesProps {
  onComplete: () => void;
}

export default function CompanyDescriptionPages({ onComplete }: CompanyDescriptionPagesProps) {
  const [pages, setPages] = useState<CompanyDescriptionPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    try {
      setLoading(true);
      const response = await fetch("/api/company-description-pages");
      if (!response.ok) throw new Error("Failed to load company description pages");
      const data = await response.json();
      
      // Sort by page number
      const sortedPages = data.sort((a: CompanyDescriptionPage, b: CompanyDescriptionPage) => 
        a.page_number - b.page_number
      );
      setPages(sortedPages);
    } catch (err: any) {
      toast.error(err.message || "Failed to load company description");
    } finally {
      setLoading(false);
    }
  }

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onComplete();
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">Loading company description...</div>
        </CardContent>
      </Card>
    );
  }

  if (pages.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            Company description pages not uploaded by admin yet.
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPageData = pages[currentPage];
  const isLastPage = currentPage === pages.length - 1;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Company Description - Page {currentPage + 1} of {pages.length}</CardTitle>
        <CardDescription>{currentPageData.title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* PDF Viewer */}
          <div className="aspect-[1/1.414] w-full border rounded overflow-hidden bg-white">
            <iframe
              title={`Company Description Page ${currentPage + 1}`}
              src={`data:application/pdf;base64,${currentPageData.content_base64}#page=1`}
              className="w-full h-[70vh]"
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={prevPage}
              disabled={currentPage === 0}
            >
              Previous
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {pages.length}
            </div>

            <Button onClick={nextPage}>
              {isLastPage ? "Onboarding Form" : "Next"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
