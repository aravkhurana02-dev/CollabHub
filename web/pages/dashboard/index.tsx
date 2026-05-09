import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Navbar from '../../components/Navbar'
import Link from 'next/link'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      fetchUser()
    }
  }, [status, router])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setUser(response.data)
    } catch (err) {
      console.error('Failed to fetch user')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-semibold mb-2">Profile Type</h3>
            <p className="text-3xl font-bold text-indigo-600 capitalize">{user?.profileType}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-semibold mb-2">Email</h3>
            <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-semibold mb-2">Subscription</h3>
            <p className="text-lg font-semibold text-gray-900 capitalize">Free Plan</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {user?.profileType === 'brand' ? (
            <>
              <Link href="/campaigns/create">
                <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg cursor-pointer transition">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Create Campaign</h3>
                  <p className="text-gray-600">Post a new campaign opportunity</p>
                </div>
              </Link>

              <Link href="/campaigns">
                <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg cursor-pointer transition">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">My Campaigns</h3>
                  <p className="text-gray-600">View and manage your campaigns</p>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link href="/campaigns">
                <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg cursor-pointer transition">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Browse Campaigns</h3>
                  <p className="text-gray-600">Discover brand opportunities</p>
                </div>
              </Link>

              <Link href="/profile">
                <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg cursor-pointer transition">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h3>
                  <p className="text-gray-600">Showcase your portfolio</p>
                </div>
              </Link>
            </>
          )}

          <Link href="/messages">
            <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg cursor-pointer transition">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Messages</h3>
              <p className="text-gray-600">Chat with collaborators</p>
            </div>
          </Link>

          <Link href="/settings">
            <div className="bg-white p-8 rounded-lg shadow hover:shadow-lg cursor-pointer transition">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-600">Manage your account</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}