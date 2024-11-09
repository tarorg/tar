import { NhostClient } from '@nhost/vue'
import { defineNuxtPlugin } from '#app'

const nhost = new NhostClient({
  subdomain: 'mpukoxooxvgkvcueukvt',
  region: 'eu-central-1',
})

export const useNhost = () => {
  return {
    signInWithGoogle: () => nhost.auth.signIn({ provider: 'google' }),
    isAuthenticated: computed(() => nhost.auth.isAuthenticated()),
    user: computed(() => nhost.auth.getUser()),
  }
}

export default defineNuxtPlugin(() => {
  return {
    provide: {
      nhost
    }
  }
}) 