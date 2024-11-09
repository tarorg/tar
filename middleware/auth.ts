import { useNhost } from '~/plugins/nhost'

export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useNhost()
  
  // Allow access to auth page
  if (to.path === '/auth') {
    return
  }
  
  // Redirect to auth page if not authenticated
  if (!isAuthenticated.value) {
    return navigateTo('/auth')
  }
}) 