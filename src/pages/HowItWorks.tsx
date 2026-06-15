import Header from "@/components/Header";

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">How Xcessly Works</h1>
        
        <div className="space-y-8">
          <p className="text-foreground text-lg">
            Sharing video links has never been easier. Follow these simple steps:
          </p>

          <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-foreground mb-4">Create a Link</h2>
            <p className="text-foreground">
              Paste your video URL into our platform and we'll generate a unique 6-character ID for you.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-foreground mb-4">Share the ID</h2>
            <p className="text-foreground">
              Share the simple 6-character ID (like AB1234) with anyone you want to give access to your video.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-foreground mb-4">Access the Video</h2>
            <p className="text-foreground">
              Recipients enter the ID on our homepage to instantly access your video link.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-foreground mb-4">Example</h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-foreground mb-2">Original URL:</p>
                <p className="text-sm text-muted-foreground break-all">
                  https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be&t=42s
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-2">Generated ID:</p>
                <p className="text-2xl font-bold text-primary">AB1234</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-2">How to share:</p>
                <p className="text-foreground">
                  Simply tell someone "Go to Xcessly and enter AB1234" - that's it!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;
