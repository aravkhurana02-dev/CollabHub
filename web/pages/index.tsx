import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Navbar from '../components/Navbar'

export default function Home() {
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
            Connect Brands with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600">Influencers</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            CollabHub is the easiest way for brands to discover, collaborate with, and manage influencer partnerships.
          </p>
          
          <div className="flex gap-4 justify-center">
            {session ? (
              <>
                <Link href="/dashboard">
                  <button className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">
                    Go to Dashboard
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/register">
                  <button className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">
                    Get Started
                  </button>
                </Link>
                <Link href="/auth/login">
                  <button className="px-8 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 font-semibold">
                    Sign In
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">For Brands</h3>
            <ul className="space-y-3 text-gray-600">
              <li>✓ Post campaigns & opportunities</li>
              <li>✓ Browse verified influencers</li>
              <li>✓ Real-time messaging</li>
              <li>✓ Track applications</li>
              <li>✓ Manage contracts</li>
            </ul>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">For Influencers</h3>
            <ul className="space-y-3 text-gray-600">
              <li>✓ Discover brand opportunities</li>
              <li>✓ Showcase your portfolio</li>
              <li>✓ Apply to campaigns</li>
              <li>✓ Negotiate directly</li>
              <li>✓ Track earnings</li>
            </ul>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Features</h3>
            <ul className="space-y-3 text-gray-600">
              <li>✓ Advanced search filters</li>
              <li>✓ Secure payments</li>
              <li>✓ Analytics dashboard</li>
              <li>✓ Mobile app</li>
              <li>✓ 24/7 support</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}