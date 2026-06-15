import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} ArticlePreview. All rights reserved.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/blogs" className="hover:text-foreground">Blogs</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
