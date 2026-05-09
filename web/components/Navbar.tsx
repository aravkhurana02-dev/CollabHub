import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'

export default function Navbar() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    localStorage.removeItem('token')
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 cursor-pointer">
            CollabHub
          </h1>
        </Link>

        <div className="flex gap-6 items-center">
          {status === 'authenticated' ? (
            <>
              <Link href="/dashboard">
                <button className="text-gray-700 hover:text-indigo-600 font-semibold">
                  Dashboard
                </button>
              </Link>
              <Link href="/campaigns">
                <button className="text-gray-700 hover:text-indigo-600 font-semibold">
                  Campaigns
                </button>
              </Link>
              <Link href="/messages">
                <button className="text-gray-700 hover:text-indigo-600 font-semibold">
                  Messages
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <button className="text-gray-700 hover:text-indigo-600 font-semibold">
                  Sign In
                </button>
              </Link>
              <Link href="/auth/register">
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-semibold">
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}