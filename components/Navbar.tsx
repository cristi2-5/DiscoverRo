import { createClient } from '@/utils/supabase/server'
import { signout } from '@/app/auth/actions'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

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
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex">
            <Link href="/" className="flex flex-shrink-0 items-center">
              <span className="text-xl font-bold text-teal-600 tracking-tight">Discover<span className="text-slate-900 dark:text-white">Ro</span></span>
            </Link>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <ThemeToggle />
            <Link
              href="/about"
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-2 text-sm font-medium transition-colors hidden sm:inline-block"
            >
              Despre Noi
            </Link>
            {user ? (
                <>
                {profile?.role === 'merchant' && (
                  <Link
                    href="/dashboard"
                    className="rounded-full px-4 py-2 text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors hidden sm:inline-block"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/plan"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  My Plan
                </Link>
                <Link
                  href="/profile"
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors max-w-[120px] truncate"
                >
                  {profile?.full_name || user.email}
                </Link>
                <form action={signout}>
                   <button
                    type="submit"
                    className="rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700 hidden sm:inline-block"
                    suppressHydrationWarning
                  >
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-4 py-2 text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-teal-600 px-5 py-2 text-sm font-bold text-white hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/30 dark:shadow-teal-900/20"
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
