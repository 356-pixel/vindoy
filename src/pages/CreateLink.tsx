import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { saveVideoLink } from "@/lib/videoStorage";
import { Copy, X } from "lucide-react";
import imageCompression from "browser-image-compression";

// Ad link shortcode mappings
const AD_LINK_SHORTCUTS: Record<string, string> = {
  "TP01": "https://omg10.com/4/10353738",
};

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  videoLink: z.string().refine(
    (val) => {
      // Allow http://, https://, www., or common domain patterns
      return /^(https?:\/\/)|(www\.)/.test(val) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(val);
    },
    { message: "Please enter a valid URL" }
  ),
  adLink: z.string().refine(
    (val) => {
      // Allow shortcode or valid URL
      if (AD_LINK_SHORTCUTS[val.toUpperCase()]) return true;
      return /^(https?:\/\/)|(www\.)/.test(val) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(val);
    },
    { message: "Please enter a valid URL or shortcode (e.g. TP01)" }
  ),
  thumbnail: z.string().min(1, "Image file is required"),
});

const CreateLink = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareableLink, setShareableLink] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      videoLink: "",
      adLink: "",
      thumbnail: "",
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const TARGET_KB = 40;
      let compressed = file;

      if (file.size > TARGET_KB * 1024) {
        // Iteratively compress until under target size
        let maxWidthOrHeight = 1280;
        for (let attempt = 0; attempt < 6; attempt++) {
          compressed = await imageCompression(file, {
            maxSizeMB: TARGET_KB / 1024,
            maxWidthOrHeight,
            useWebWorker: true,
            initialQuality: 0.8,
            fileType: "image/jpeg",
          });
          if (compressed.size <= TARGET_KB * 1024) break;
          maxWidthOrHeight = Math.floor(maxWidthOrHeight * 0.8);
        }
      }

      if (compressed.size > TARGET_KB * 1024) {
        toast({
          title: "Could not compress",
          description: "Image could not be reduced under 40KB. Try a smaller image.",
          variant: "destructive",
        });
        setIsCompressing(false);
        e.target.value = "";
        return;
      }

      setThumbnailFile(compressed);
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("thumbnail", reader.result as string, { shouldValidate: true });
      };
      reader.readAsDataURL(compressed);
      toast({
        title: "Image ready",
        description: `Compressed to ${(compressed.size / 1024).toFixed(1)} KB`,
      });
    } catch (err) {
      toast({
        title: "Compression failed",
        description: "Please try a different image.",
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = () => {
    setThumbnailFile(null);
    form.setValue("thumbnail", "", { shouldValidate: true });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const newLink = await saveVideoLink({
        title: values.title,
        description: "",
        videoLink: values.videoLink.startsWith('http') ? values.videoLink : `https://${values.videoLink}`,
        adLink: AD_LINK_SHORTCUTS[values.adLink.toUpperCase()] || (values.adLink.startsWith('http') ? values.adLink : `https://${values.adLink}`),
        thumbnail: values.thumbnail,
      }, thumbnailFile || undefined);
      
      const link = `https://xcessly.com/${newLink.id}`;
      setShareableLink(link);
      toast({
        title: "Success!",
        description: `Video link created with ID: ${newLink.id}`,
      });
      
      // Auto-scroll to shareable link section
      setTimeout(() => {
        const linkSection = document.getElementById("shareableLinkSection");
        if (linkSection) {
          linkSection.scrollIntoView({ behavior: "smooth" });
          linkSection.classList.add("highlight-pulse");
          setTimeout(() => linkSection.classList.remove("highlight-pulse"), 2000);
        }
      }, 100);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create video link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!shareableLink) return;
    
    navigator.clipboard.writeText(shareableLink);
    
    // Show visual confirmation
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 2000);
    
    // Smooth scroll to bottom
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
          Create Video Link
        </h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Image File * 
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      max: 40 KB
                    </span>
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="flex items-center gap-3">
                        <label htmlFor="image-upload">
                          <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            disabled={isCompressing}
                            asChild
                          >
                            <span>{isCompressing ? "Compressing..." : "Upload Image"}</span>
                          </Button>
                        </label>
                        {thumbnailFile && (
                          <span className="text-sm text-muted-foreground">
                            {(thumbnailFile.size / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                      {field.value && (
                        <div className="relative inline-block mt-2">
                          <img
                            src={field.value}
                            alt="Thumbnail preview"
                            className="w-32 h-32 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            aria-label="Remove image"
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow hover:opacity-90"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter video title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <FormField
              control={form.control}
              name="videoLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Video Link * 
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      | <a href="https://catbox.moe/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Host file here</a>
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="file host link" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Your Ad Link * 
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      | <a href="https://monetag.com/?ref_id=zV4V" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Join here</a>
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="your ad link" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Link"}
            </Button>

            {shareableLink && (
              <div id="shareableLinkSection" className="mt-6 p-4 border rounded-md bg-muted/50 relative transition-all">
                <p className="text-sm text-muted-foreground mb-2">Shareable Link:</p>
                <div className="flex gap-2">
                  <Input 
                    value={shareableLink} 
                    readOnly 
                    className="flex-1"
                  />
                  <Button 
                    type="button"
                    onClick={copyToClipboard}
                    size="icon"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {showCopySuccess && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg animate-in fade-in slide-in-from-bottom-2">
                    ✅ Link Copied!
                  </div>
                )}
              </div>
            )}
          </form>
        </Form>
      </main>
    </div>
  );
};

export default CreateLink;
