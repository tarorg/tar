import { useNhost } from '~/plugins/nhost'

export const useAuthRedirect = () => {
  const { isAuthenticated } = useNhost()
  const router = useRouter()

  onMounted(() => {
    watch(isAuthenticated, (isAuth) => {
      if (!isAuth && router.currentRoute.value.path !== '/auth') {
        router.push('/auth')
      } else if (isAuth && router.currentRoute.value.path === '/auth') {
        router.push('/')
      }
    }, { immediate: true })
  })
} 