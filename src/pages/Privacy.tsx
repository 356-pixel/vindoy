import Header from "@/components/Header";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-foreground">
          <h2 className="text-2xl font-bold mt-8 mb-4">Information We Collect</h2>
          <p>
            When you use Xcessly, we collect the following information:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Video URLs that you submit to create shareable links</li>
            <li>Optional titles and descriptions you provide</li>
            <li>Basic usage analytics to improve our service</li>
            <li>IP addresses for security and fraud prevention</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and maintain our video link sharing service</li>
            <li>Generate unique IDs for your video links</li>
            <li>Improve our platform and user experience</li>
            <li>Prevent abuse and ensure security</li>
            <li>Comply with legal obligations</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Information Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal information to third parties, except:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>When required by law or legal process</li>
            <li>To protect our rights, property, or safety</li>
            <li>With your explicit consent</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Data Security</h2>
          <p>
            We implement appropriate security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Data Retention</h2>
          <p>
            We retain your video links and associated data indefinitely unless you request deletion. You can contact us at any time to request removal of your data.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@xcessly.com.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
