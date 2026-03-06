'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const role = formData.get('role') as 'explorer' | 'merchant'

  if (!email || !password || !fullName || !role) {
    throw new Error('All fields are required')
  }

  const supabase = await createClient()

  // Sign up the user
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      }
    }
  })

  if (signUpError) {
    throw new Error(signUpError.message)
  }

  if (data.user) {
    // Insert into public.profiles table
    // Note: Supabase sets up trigger locally sometimes, but the prompt asked:
    // "La Sign Up, datele trebuie sa fie salvate in tabelul public.profiles (id, role, full_name)."
    // If there is no trigger, we manually insert:
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: fullName,
        role: role, // will be 'explorer' or 'merchant'
      })
      
    if (profileError) {
        console.error(profileError)
        throw new Error(`Error creating user profile: ${profileError.message} (Code: ${profileError.code})`)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
