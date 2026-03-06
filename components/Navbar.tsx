import { createClient } from '@/utils/supabase/server'
import { signout } from '@/app/auth/actions'
import Link from 'next/link'

export default async function Navbar() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
      const { data } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
      profile = data
  }

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex">
            <Link href="/" className="flex flex-shrink-0 items-center">
              <span className="text-xl font-bold text-indigo-600">DiscoverRo</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
                <>
                {profile?.role === 'merchant' && (
                  <Link
                    href="/dashboard"
                    className="rounded-md px-3 py-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-50/10 transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/plan"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                >
                  My Plan
                </Link>
                <Link
                  href="/profile"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                >
                  {profile?.full_name || user.email}
                </Link>
                <form action={signout}>
                   <button
                    type="submit"
                    className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
                  >
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
