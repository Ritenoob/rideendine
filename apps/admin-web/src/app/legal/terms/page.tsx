export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700 mb-4">
            By accessing and using RideNDine, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Use License</h2>
          <p className="text-gray-700 mb-4">
            Permission is granted to temporarily access the services for personal, non-commercial use only.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. User Responsibilities</h2>
          <p className="text-gray-700 mb-4">
            Users must provide accurate information and maintain the security of their account credentials.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Contact Information</h2>
          <p className="text-gray-700 mb-4">
            For questions about these Terms, please contact us at legal@ridendine.com
          </p>
        </div>
      </div>
    </div>
  );
}
