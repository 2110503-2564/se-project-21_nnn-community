import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Provider Registration Successful | CEDT Rentals',
  description: 'Your car provider account has been created successfully',
};

export default function ProviderSuccessPage() {
  return (
    <main className="py-16 px-4">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-medium mb-3">Provider Registration Successful</h1>
        
        <p className="text-gray-600 mb-8">
          Your car provider account has been created successfully. You can now sign in using your email and password.
        </p>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            As a car provider, you'll be able to manage your car fleet and track your own rentals.
          </p>
          
          <Link 
            href="/signin?type=provider"  //takes you straight to provider login
            className="inline-block px-6 py-3 bg-[#8A7D55] text-white rounded-md hover:bg-[#766b48] transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}