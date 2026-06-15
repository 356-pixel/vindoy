import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import AdsterraBanner from "@/components/AdsterraBanner";
import { getVideoLinkById, VideoLink, incrementVideoCounter } from "@/lib/videoStorage";
import { linkifyText } from "@/lib/linkify";


declare global {
  interface Window {
    ADMIN_AD_LINK?: string;
    gtag?: (...args: any[]) => void;
  }
}

const VideoPage = () => {
  const { id } = useParams<{ id: string }>();
  const [videoLink, setVideoLink] = useState<VideoLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdLink, setShowAdLink] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchVideoLink = async () => {
      if (id) {
        if (id.toUpperCase() === "XM9638") {
          window.location.replace("https://t.crdtg2.com/334234/7964?aff_sub5=SF_006OG000004lmDN");
          return;
        }
        const link = await getVideoLinkById(id);
        setVideoLink(link);
        setLoading(false);
      }
    };
    fetchVideoLink();
  }, [id]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!videoLink) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <h1 className="text-3xl font-bold text-foreground mb-4">Video Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The video ID "{id}" does not exist.
          </p>
          <Link to="/">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const handleAdLinkClick = async () => {
    if (!videoLink || isProcessing) return;
    
    // Track GA4 event
    if (window.gtag) {
      window.gtag('event', 'get_video_link_click', {
        button_name: 'Get video link'
      });
    }
    
    setIsProcessing(true);
    
    try {
      // Atomically increment the counter and get the new value
      const newCounter = await incrementVideoCounter(videoLink.id);
      
      // Determine which ad link to show based on counter
      // If divisible by 5, use admin ad link; otherwise use user ad link
      const adLinkToShow = newCounter % 5 === 0 
        ? (window.ADMIN_AD_LINK || "https://otieu.com/4/10149369")
        : videoLink.adLink;
      
      // Open the appropriate ad link in new tab
      window.open(adLinkToShow, "_blank");
      
      // Start 7-second countdown
      setCountdown(7);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            setShowAdLink(true);
            setIsProcessing(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error incrementing counter:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        
        <div className="bg-card rounded-lg shadow-lg overflow-hidden">
          <div className="w-full aspect-[1.5/1] overflow-hidden">
            <img
              src={videoLink.thumbnail}
              alt={videoLink.title}
              className="w-full h-full object-cover rounded-t-lg"
            />
          </div>
          
          <div className="p-6 space-y-4">
            {!showAdLink && (
              <h1 className="text-lg md:text-xl font-bold text-foreground">
                {videoLink.title}
              </h1>
            )}
            
            <div className="space-y-3 pt-0">
              {!showAdLink && countdown === null && (
                <>
                  <Button
                    onClick={handleAdLinkClick}
                    disabled={isProcessing}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Get Video Link
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: Click back button to view video link, if ads pop up. Ads help us to sustain our site. Thanks
                  </p>
                </>
              )}
              
              {countdown !== null && (
                <div className="text-center py-3">
                  <p className="text-lg font-semibold text-foreground">
                    Please wait {countdown} seconds...
                  </p>
                </div>
              )}

              {showAdLink && (
                <div className="text-center py-3 space-y-3">
                  <p className="text-sm text-muted-foreground">Video Link:</p>
                  <a
                    href={videoLink.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium break-all block"
                  >
                    {videoLink.videoLink}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center space-y-4">
        </div>
        
      </main>
      <AdsterraBanner />
    </div>
  );
};

export default VideoPage;
