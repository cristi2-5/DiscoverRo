import { getProfile } from '@/lib/actions/profile'
import { ProfileClient } from './ProfileClient'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const profileData = await getProfile()

  if (!profileData) {
    redirect('/auth/login')
  }

  return (
    <div className="flex flex-col bg-gray-50 min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl w-full">
        <ProfileClient initialProfile={profileData} />
      </div>
    </div>
  )
}
