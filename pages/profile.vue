<script setup lang="ts">
import { useAuthData } from '~/composables/useAuthData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Mail, Calendar, Key, ArrowLeft, LogOut } from 'lucide-vue-next'
import { useNhost } from '~/plugins/nhost'

const { userData } = useAuthData()
const { signOut } = useNhost()
const router = useRouter()

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
      <CardHeader class="flex flex-row items-center justify-between">
        <CardTitle class="text-2xl">Profile Information</CardTitle>
        <Button variant="outline" @click="router.push('/auth')">
          Switch Account
        </Button>
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

        <!-- Additional Metadata -->
        <div v-if="Object.keys(userData.metadata || {}).length > 0">
          <h3 class="text-lg font-semibold mb-2">Additional Information</h3>
          <div class="space-y-2">
            <div 
              v-for="(value, key) in userData.metadata" 
              :key="key"
              class="flex items-center space-x-2 p-2 rounded-lg bg-muted/50"
            >
              <div>
                <p class="text-sm font-medium">{{ key }}</p>
                <p class="text-sm text-muted-foreground">{{ value }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-4">
          <Button variant="outline" class="w-full">
            Update Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template> 