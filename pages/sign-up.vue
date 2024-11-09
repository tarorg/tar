<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-vue-next'
import { useNhost } from '~/plugins/nhost'
import { useAuthError } from '~/composables/useAuthError'

const { signUpWithEmail } = useNhost()
const { error, isLoading, handleAuthError, clearError, setLoading } = useAuthError()
const router = useRouter()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const displayName = ref('')

const goBack = () => {
  router.push('/auth')
}

const handleSubmit = async () => {
  try {
    // Basic validation
    if (password.value !== confirmPassword.value) {
      throw new Error('Passwords do not match')
    }

    if (password.value.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    if (!displayName.value) {
      throw new Error('Display name is required')
    }

    setLoading(true)
    clearError()
    
    const { session, error: signUpError } = await signUpWithEmail(
      email.value, 
      password.value,
      {
        displayName: displayName.value,
        metadata: {
          createdAt: new Date().toISOString()
        }
      }
    )
    
    if (signUpError) {
      throw signUpError
    }

    if (session) {
      router.push('/')
    }
  } catch (e: unknown) {
    handleAuthError(e)
  } finally {
    setLoading(false)
  }
}
</script>

<template>
  <div class="min-h-screen p-4">
    <Button @click="goBack" variant="ghost" class="mb-4">
      <ArrowLeft class="mr-2 h-4 w-4" />
      Back to Login
    </Button>
    <Card class="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle class="text-2xl">Create Account</CardTitle>
        <CardDescription>
          Sign up for a new account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="grid gap-4">
          <div class="grid gap-2">
            <Label for="displayName">Display Name</Label>
            <Input
              id="displayName"
              v-model="displayName"
              type="text"
              placeholder="John Doe"
              required
            />
          </div>
          
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>

          <div class="grid gap-2">
            <Label for="password">Password</Label>
            <Input 
              id="password"
              v-model="password"
              type="password" 
              required 
              placeholder="Min. 8 characters"
            />
          </div>

          <div class="grid gap-2">
            <Label for="confirmPassword">Confirm Password</Label>
            <Input 
              id="confirmPassword"
              v-model="confirmPassword"
              type="password" 
              required 
              placeholder="Confirm your password"
            />
          </div>
          
          <div v-if="error" class="text-sm text-red-500 text-center">
            {{ error }}
          </div>
          
          <Button type="submit" class="w-full" :disabled="isLoading">
            {{ isLoading ? 'Creating Account...' : 'Create Account' }}
          </Button>
        </form>
        
        <div class="mt-4 text-center text-sm">
          Already have an account?
          <button 
            @click="router.push('/auth')" 
            class="underline ml-1"
          >
            Sign in
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
</template> 