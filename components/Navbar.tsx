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
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex">
            <Link href="/" className="flex flex-shrink-0 items-center">
              <span className="text-xl font-bold text-teal-600 tracking-tight">Discover<span className="text-slate-900">Ro</span></span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
                <>
                {profile?.role === 'merchant' && (
                  <Link
                    href="/dashboard"
                    className="rounded-full px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/plan"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  My Plan
                </Link>
                <Link
                  href="/profile"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  {profile?.full_name || user.email}
                </Link>
                <form action={signout}>
                   <button
                    type="submit"
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors border border-slate-200"
                  >
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-slate-900 px-4 py-2 text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-700 transition-all shadow-lg hover:shadow-teal-500/30"
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
