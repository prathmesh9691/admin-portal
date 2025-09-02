export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container max-w-6xl mx-auto px-4 py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} PulseHR. All rights reserved.</p>
        <p className="opacity-80">Built with React + Tailwind.</p>
      </div>
    </footer>
  );
}
