export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-gray-700 mb-4">
            We collect information you provide directly to us, including name, email address, phone number, and delivery addresses.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">
            We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Information Sharing</h2>
          <p className="text-gray-700 mb-4">
            We do not share your personal information with third parties except as described in this policy or with your consent.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Data Security</h2>
          <p className="text-gray-700 mb-4">
            We implement appropriate technical and organizational measures to protect your personal information.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have questions about this Privacy Policy, please contact us at privacy@ridendine.com
          </p>
        </div>
      </div>
    </div>
  );
}
