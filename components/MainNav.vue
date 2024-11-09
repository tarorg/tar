<script setup lang="ts">
import { useNhost } from '~/plugins/nhost'
import { useAuthData } from '~/composables/useAuthData'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { User, LogOut, UserCircle } from 'lucide-vue-next'

const { signOut } = useNhost()
const { userData } = useAuthData()
const router = useRouter()

const handleSignOut = async () => {
  const { error } = await signOut()
  if (!error) {
    router.push('/auth')
  }
}
</script>

<template>
  <nav class="border-b bg-background px-4 py-2">
    <div class="flex items-center justify-between">
      <NuxtLink to="/" class="text-xl font-bold">
        App Name
      </NuxtLink>
      
      <div v-if="userData" class="flex items-center gap-4">
        <span class="text-sm">{{ userData.name }}</span>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" class="relative h-8 w-8 rounded-full">
              <img 
                v-if="userData.avatar" 
                :src="userData.avatar" 
                :alt="userData.name"
                class="h-8 w-8 rounded-full"
              />
              <User v-else class="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuItem class="gap-2" disabled>
              <span class="text-xs text-muted-foreground">Signed in as</span>
              <span class="text-sm font-medium">{{ userData.email }}</span>
            </DropdownMenuItem>
            <NuxtLink to="/profile">
              <DropdownMenuItem class="gap-2 cursor-pointer">
                <UserCircle class="h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </NuxtLink>
            <DropdownMenuItem class="gap-2 cursor-pointer" @click="router.push('/auth')">
              <User class="h-4 w-4" />
              <span>Switch Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem class="gap-2 cursor-pointer" @click="handleSignOut">
              <LogOut class="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </nav>
</template> 