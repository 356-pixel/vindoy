import Header from "@/components/Header";

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">About Xcessly</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-foreground">
          <p>
            Xcessly is a simple and secure platform for sharing video links through easy-to-remember IDs.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Our Mission</h2>
          <p>
            We believe that sharing video content should be simple, secure, and accessible. Our platform allows you to convert long, complex video URLs into short, memorable 6-character IDs that anyone can easily share and access.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Why Choose Xcessly?</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Simple 6-character IDs (2 letters + 4 digits)</li>
            <li>Fast and reliable video link access</li>
            <li>Mobile-optimized design</li>
            <li>Secure and private</li>
            <li>No registration required</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">How It Started</h2>
          <p>
            Xcessly was created to solve the common problem of sharing long, unwieldy video URLs. Whether you're sharing educational content, entertainment videos, or business presentations, our platform makes it easy to create memorable links that anyone can access quickly.
          </p>
        </div>
      </main>
    </div>
  );
};

export default About;
