import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Mobile Layout */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-foreground p-2"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Link to="/" className="text-2xl font-bold text-foreground">
            xcessly
          </Link>
        </div>

        {/* Desktop Logo */}
        <Link to="/" className="hidden md:block text-2xl font-bold text-foreground">
          xcessly
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/about" className="text-foreground hover:text-primary transition-colors">
            About us
          </Link>
          <Link to="/how-it-works" className="text-foreground hover:text-primary transition-colors">
            How it works
          </Link>
          <Link to="/terms" className="text-foreground hover:text-primary transition-colors">
            Terms
          </Link>
          <Link to="/privacy" className="text-foreground hover:text-primary transition-colors">
            Privacy
          </Link>
          <Link to="/create">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Create Links
            </Button>
          </Link>
        </nav>

        <div className="md:hidden">
          <Link to="/create">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Create Links
            </Button>
          </Link>
        </div>
      </div>
      
      {isMenuOpen && (
        <nav className="md:hidden border-t py-3 px-4 flex flex-col gap-3 text-sm">
          <Link 
            to="/about" 
            className="text-foreground hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            About us
          </Link>
          <Link 
            to="/how-it-works" 
            className="text-foreground hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            How it works
          </Link>
          <Link 
            to="/terms" 
            className="text-foreground hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Terms
          </Link>
          <Link 
            to="/privacy" 
            className="text-foreground hover:text-primary transition-colors py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Privacy
          </Link>
        </nav>
      )}
    </header>
  );
};

export default Header;
