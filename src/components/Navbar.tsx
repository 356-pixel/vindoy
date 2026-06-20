import { Link, useLocation } from "react-router-dom";
import { Zap } from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  if (location.pathname === "/") return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Zap className="h-5 w-5 text-primary" />
          Vindoy
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About us</Link>
          <Link to="/blogs" className="text-muted-foreground hover:text-foreground transition-colors">Blogs</Link>
          <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact us</Link>
          <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
        </nav>
      </div>
    </header>
  );
}
