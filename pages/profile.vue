<script setup lang="ts">
import { useAuthData } from '~/composables/useAuthData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Mail, Calendar, Key, ArrowLeft, LogOut } from 'lucide-vue-next'
import { useNhost } from '~/plugins/nhost'

const { userData, isLoggedIn } = useAuthData()
const { signOut } = useNhost()
const router = useRouter()

// Redirect to auth page if not logged in
watchEffect(() => {
  if (!isLoggedIn) {
    router.push('/auth')
  }
})

const goBack = () => {
  router.push('/')
}

const handleSignOut = async () => {
  const { error } = await signOut()
  if (!error) {
    router.push('/auth')
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="container mx-auto p-4 max-w-2xl">
    <!-- Not Logged In State -->
    <div v-if="!isLoggedIn" class="flex justify-center items-center min-h-[60vh]">
      <div class="text-center">
        <p class="text-lg text-muted-foreground mb-4">Please sign in to view your profile</p>
        <Button @click="router.push('/auth')">
          Sign In
        </Button>
      </div>
    </div>

    <!-- Logged In State -->
    <template v-else>
      <div class="flex justify-between items-center mb-4">
        <Button @click="goBack" variant="ghost">
          <ArrowLeft class="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button variant="ghost" size="icon" @click="handleSignOut" class="text-muted-foreground hover:text-destructive">
          <LogOut class="h-5 w-5" />
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle class="text-2xl">Profile Information</CardTitle>
        </CardHeader>
        <CardContent v-if="userData" class="space-y-6">
          <!-- Profile Header -->
          <div class="flex items-center space-x-4">
            <div class="h-20 w-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              <img 
                v-if="userData.avatar" 
                :src="userData.avatar" 
                :alt="userData.name"
                class="h-full w-full object-cover"
              />
              <User v-else class="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h2 class="text-xl font-semibold">{{ userData.name }}</h2>
              <p class="text-sm text-muted-foreground">User Profile</p>
            </div>
          </div>

          <!-- Profile Details -->
          <div class="space-y-4">
            <div class="flex items-center space-x-2 p-2 rounded-lg bg-muted/50">
              <Mail class="h-5 w-5 text-muted-foreground" />
              <div>
                <p class="text-sm font-medium">Email</p>
                <p class="text-sm text-muted-foreground">{{ userData.email }}</p>
              </div>
            </div>

            <div class="flex items-center space-x-2 p-2 rounded-lg bg-muted/50">
              <Key class="h-5 w-5 text-muted-foreground" />
              <div>
                <p class="text-sm font-medium">User ID</p>
                <p class="text-sm text-muted-foreground">{{ userData.id }}</p>
              </div>
            </div>

            <div class="flex items-center space-x-2 p-2 rounded-lg bg-muted/50">
              <Calendar class="h-5 w-5 text-muted-foreground" />
              <div>
                <p class="text-sm font-medium">Last Login</p>
                <p class="text-sm text-muted-foreground">{{ formatDate(userData.lastLogin) }}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template> 