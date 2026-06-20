import { Link } from "react-router-dom";
import { Link2 } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <nav
        className="container flex h-16 items-center justify-between"
        aria-label="Primary"
      >
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-md shadow-primary/20">
            <Link2 className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-lg font-bold text-gradient-primary">Vindoy</span>
        </Link>
      </nav>
    </header>
  );
}
