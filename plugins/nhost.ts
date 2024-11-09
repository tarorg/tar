import { NhostClient } from '@nhost/vue'
import { defineNuxtPlugin } from '#app'
import type { User } from '@nhost/nhost-js'
import type { AuthErrorPayload } from '@nhost/nhost-js'

interface AuthUser extends User {
  id: string
  email: string
  displayName: string
  metadata: {
    [key: string]: any
  }
}

interface SignUpResponse {
  session: {
    user: AuthUser | null
  } | null
  error: AuthErrorPayload | null
}

interface AuthState {
  isAuthenticated: ComputedRef<boolean>
  user: ComputedRef<AuthUser | null>
}

interface AuthActions {
  signInWithEmail: (email: string, password: string) => Promise<SignUpResponse>
  signUpWithEmail: (email: string, password: string, options?: {
    displayName?: string
    metadata?: Record<string, any>
  }) => Promise<SignUpResponse>
  signOut: () => Promise<{ error: AuthErrorPayload | null }>
  getAuthData: () => AuthUser | null
}

const authData = reactive({
  user: null as AuthUser | null,
})

const nhost = new NhostClient({
  subdomain: 'mpukoxooxvgkvcueukvt',
  region: 'eu-central-1',
})

nhost.auth.onAuthStateChanged((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    const user = session.user as AuthUser
    authData.user = {
      ...user,
      metadata: {
        ...user.metadata,
        lastLogin: new Date().toISOString(),
      }
    }
    localStorage.setItem('auth_data', JSON.stringify(authData.user))
  } else if (event === 'SIGNED_OUT') {
    authData.user = null
    localStorage.removeItem('auth_data')
  }
})

export const useNhost = (): AuthState & AuthActions => {
  const initAuthData = () => {
    const stored = localStorage.getItem('auth_data')
    if (stored) {
      try {
        authData.user = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse stored auth data')
      }
    }
  }

  onMounted(initAuthData)

  return {
    signInWithEmail: (email: string, password: string) => 
      nhost.auth.signIn({ email, password }),
    signUpWithEmail: (email: string, password: string, options = {}) => 
      nhost.auth.signUp({ 
        email, 
        password,
        options: {
          displayName: options.displayName,
          metadata: options.metadata
        }
      }),
    signOut: () => nhost.auth.signOut(),
    isAuthenticated: computed(() => nhost.auth.isAuthenticated()),
    user: computed(() => authData.user),
    getAuthData: () => authData.user,
  }
}

export default defineNuxtPlugin(() => {
  return {
    provide: {
      nhost
    }
  }
}) 