import { Link, useLocation } from "react-router-dom";
import { Zap, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

const navLinks = [
  { to: "/about", label: "About us" },
  { to: "/blogs", label: "Blogs" },
  { to: "/contact", label: "Contact us" },
  { to: "/privacy", label: "Privacy" },
];

function MobileMenu({ isHome = false }: { isHome?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-accent"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[260px]">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <nav className="mt-8 flex flex-col gap-5">
          {!isHome && (
            <Link
              to="/"
              className="flex items-center gap-2 text-lg font-bold tracking-tight"
              onClick={() => setOpen(false)}
            >
              <Zap className="h-5 w-5 text-primary" />
              Vindoy
            </Link>
          )}
          {navLinks.map((link) => (
            <SheetClose asChild key={link.to}>
              <Link
                to={link.to}
                className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  if (isHome) {
    return (
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md sm:hidden">
        <div className="container flex h-14 items-center justify-end">
          <MobileMenu isHome />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <Zap className="h-5 w-5 text-primary" />
          Vindoy
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-4 text-sm font-medium sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <div className="sm:hidden">
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
