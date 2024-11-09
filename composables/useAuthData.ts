import { useNhost } from '~/plugins/nhost'

export const useAuthData = () => {
  const { user } = useNhost()
  
  const userData = computed(() => {
    if (!user.value) return null
    
    return {
      id: user.value.id,
      email: user.value.email,
      name: user.value.displayName,
      avatar: user.value.metadata.avatar_url,
      lastLogin: user.value.metadata.lastLogin,
      metadata: user.value.metadata,
      // Add any other user data you want to access
    }
  })

  return {
    userData,
    isLoggedIn: computed(() => !!user.value),
  }
} 