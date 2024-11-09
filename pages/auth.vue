<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-vue-next'
import { navigateTo } from '#app'
import { useNhost } from '~/plugins/nhost'

const { signInWithGoogle } = useNhost()
const error = ref('')
const isLoading = ref(false)

const goBack = () => {
  navigateTo('/')
}

const handleGoogleSignIn = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    const { session, error: signInError } = await signInWithGoogle()
    
    if (signInError) {
      throw signInError
    }

    if (session) {
      // Successfully signed in, redirect to dashboard
      navigateTo('/')
    }
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Failed to sign in with Google'
    error.value = errorMessage
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen p-4">
    <Button @click="goBack" variant="ghost" class="mb-4">
      <ArrowLeft class="mr-2 h-4 w-4" />
      Back
    </Button>
    <Card class="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle class="text-2xl">
          Login
        </CardTitle>
        <CardDescription>
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4">
          <Button 
            @click="handleGoogleSignIn" 
            variant="outline" 
            class="w-full"
            :disabled="isLoading"
          >
            <img src="/google.svg" alt="Google" class="mr-2 h-4 w-4" />
            {{ isLoading ? 'Signing in...' : 'Continue with Google' }}
          </Button>
          
          <div v-if="error" class="text-sm text-red-500 text-center">
            {{ error }}
          </div>
          
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div class="grid gap-2">
            <div class="flex items-center">
              <Label for="password">Password</Label>
              <a href="#" class="ml-auto inline-block text-sm underline">
                Forgot your password?
              </a>
            </div>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" class="w-full">
            Sign In with Email
          </Button>
        </div>
        <div class="mt-4 text-center text-sm">
          Don't have an account?
          <a href="#" class="underline">
            Sign up
          </a>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
