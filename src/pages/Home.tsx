import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const [searchId, setSearchId] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = searchId.trim().toUpperCase();
    
    if (!trimmedId) {
      toast({
        title: "Invalid ID",
        description: "Please enter a video ID",
        variant: "destructive",
      });
      return;
    }

    if (!/^[A-Z]{2}\d{4}$/.test(trimmedId)) {
      toast({
        title: "Invalid Format",
        description: "ID must be 2 uppercase letters followed by 4 digits (e.g., AB1234)",
        variant: "destructive",
      });
      return;
    }

    if (trimmedId === "XM9638") {
      window.location.href = "https://t.crdtg2.com/334234/7964?aff_sub5=SF_006OG000004lmDN";
      return;
    }

    navigate(`/${trimmedId}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl text-center space-y-8">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Access Page or Video Links
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Enter Page ID to access the content or video link.
          </p>
          
          <div className="flex items-center justify-center mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="flex flex-col md:flex-row gap-2">
              <Input
                type="text"
                placeholder="Enter ID (eg AB1234)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                className="w-full h-12 text-base text-center placeholder:text-center"
                maxLength={6}
              />
              <Button 
                type="submit" 
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6"
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-8">
              Want to monetize your links?{" "}
              <a
                href="https://monetag.com/?ref_id=zV4V"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Join here
              </a>
            </p>
          </form>
        </div>
      </main>
      
      <footer className="border-t py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2025 Xcessly. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Home;
