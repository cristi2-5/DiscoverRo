'use client'

import { useState, useTransition } from 'react'
import { User, ShieldCheck, Mail, LogOut as LogOutIcon, Edit2 } from 'lucide-react'
import { updateProfileName } from '@/lib/actions/profile'
import { signout } from '@/app/auth/actions'

export function ProfileClient({ initialProfile }: { initialProfile: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(initialProfile?.full_name || '')
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    startTransition(async () => {
      const res = await updateProfileName(fullName)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setIsEditing(false)
      }
    })
  }

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-100 pb-6">
      <div className="px-4 py-5 sm:px-6 bg-indigo-600 flex justify-between items-center">
        <div>
           <h3 className="text-xl font-bold leading-6 text-white text-shadow">Setări Cont</h3>
           <p className="mt-1 max-w-2xl text-sm text-indigo-100">Informații personale și abonament.</p>
        </div>
        <form action={signout}>
          <button 
             title="Deconectare"
             type="submit"
             className="text-white hover:text-rose-200 transition-colors bg-white/10 p-2 rounded-full"
          >
             <LogOutIcon className="h-5 w-5" />
          </button>
        </form>
      </div>

      <div className="px-4 py-8 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          
          <div className="flex-shrink-0">
             <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-white shadow-lg mx-auto sm:mx-0">
                <User className="h-12 w-12 text-indigo-500" />
             </div>
             
             <div className="mt-4 flex flex-col items-center sm:items-start gap-2">
               <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-widest ${
                 initialProfile.role === 'merchant' 
                   ? 'bg-amber-100 text-amber-800' 
                   : 'bg-emerald-100 text-emerald-800'
               }`}>
                 Cont {initialProfile.role || 'Explorer'}
               </span>

               <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide ${
                 initialProfile.is_premium 
                   ? 'bg-purple-100 text-purple-800' 
                   : 'bg-gray-100 text-gray-800'
               }`}>
                 <ShieldCheck className="h-3 w-3 mr-1" />
                 {initialProfile.is_premium ? 'Premium Activ' : 'Plan Gratuit'}
               </span>
             </div>
          </div>

          <div className="flex-1 w-full mt-4 sm:mt-0">
            {isEditing ? (
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nume Complet
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full rounded-md border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" 
                    required 
                  />
                </div>
                {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
                
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
                  >
                    {isPending ? 'Se salvează...' : 'Salvează'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                        setIsEditing(false)
                        setFullName(initialProfile.full_name || '')
                    }}
                    className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Anulează
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Nume Complet</h4>
                    <p className="mt-1 text-xl font-semibold text-gray-900">{initialProfile.full_name || 'Setează un nume'}</p>
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-indigo-600 hover:text-indigo-900 p-2 bg-indigo-50 rounded-md transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="pb-4">
                  <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Adresă Email
                  </h4>
                  <p className="mt-1 text-base text-gray-900">{initialProfile.email}</p>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}
