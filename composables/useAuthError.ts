export const useAuthError = () => {
  const error = ref<string>('')
  const isLoading = ref(false)

  const handleAuthError = (e: unknown) => {
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred'
    error.value = errorMessage
  }

  return {
    error,
    isLoading,
    handleAuthError,
    clearError: () => error.value = '',
    setLoading: (loading: boolean) => isLoading.value = loading
  }
} 