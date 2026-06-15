import Header from "@/components/Header";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms and Conditions</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-foreground">
          <h2 className="text-2xl font-bold mt-8 mb-4">Acceptance of Terms</h2>
          <p>
            By accessing and using Xcessly, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Advertisement Policy</h2>
          <p>
            Users acknowledge and accept that advertisements are an integral part of our service model and agree to view these advertisements as part of accessing video content.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Use License</h2>
          <p>
            Permission is granted to temporarily use Xcessly for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to reverse engineer any software contained on the website</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Content Guidelines</h2>
          <p>
            Users are responsible for the content they share through our platform. You agree not to use our service to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Share illegal, harmful, or offensive content</li>
            <li>Violate any intellectual property rights</li>
            <li>Distribute malware or malicious links</li>
            <li>Engage in spam or fraudulent activities</li>
            <li>Share content that violates any applicable laws or regulations</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Service Availability</h2>
          <p>
            We strive to maintain high availability of our service, but we do not guarantee uninterrupted access. We reserve the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Temporarily suspend service for maintenance</li>
            <li>Remove or disable access to any content that violates our terms</li>
            <li>Terminate accounts that abuse our service</li>
            <li>Modify or discontinue features with reasonable notice</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Limitation of Liability</h2>
          <p>
            In no event shall Xcessly or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Xcessly's website, even if Xcessly or an authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Privacy and Data Protection</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices regarding the collection and use of your information.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Modifications to Terms</h2>
          <p>
            Xcessly may revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Information</h2>
          <p>
            If you have any questions about these Terms and Conditions, please contact us at terms@xcessly.com.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Terms;
