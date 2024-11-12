<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  User,
  CreditCard,
  Settings,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart,
  Square,
  Triangle,
  Circle,
  Layers,
} from 'lucide-vue-next'

const menuSearchQuery = ref('')

const menuItems = [
  { icon: User, label: 'Profile', link: '/profile' },
  { icon: CreditCard, label: 'Billing', link: '/billing' },
  { icon: Settings, label: 'Settings', link: '/settings' },
  { icon: LayoutDashboard, label: 'Home', link: '/' },
  { icon: ShoppingCart, label: 'Orders', link: '/orders' },
  { icon: Package, label: 'Products', link: '/products' },
  { icon: Layers, label: 'Instances', link: '/instances' },
  { icon: Users, label: 'Customers', link: '/customers' },
  { icon: BarChart, label: 'Analytics', link: '/analytics' },
  { icon: Settings, label: 'Options', link: '/options' },
]

const filteredMenuItems = computed(() => {
  return menuItems.filter(item => 
    item.label.toLowerCase().includes(menuSearchQuery.value.toLowerCase())
  )
})
</script>

<template>
  <header class="sticky top-0 flex h-16 items-center border-b bg-white px-2 md:px-6 z-10">
    <div class="flex w-full items-center">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="secondary" size="icon" class="rounded-full">
            <Square class="h-5 w-5" />
            <span class="sr-only">Toggle menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-screen h-[calc(100vh-4rem)] md:h-auto md:w-56">
          <div class="p-2">
            <div class="relative w-full items-center">
              <Input 
                v-model="menuSearchQuery"
                type="text" 
                placeholder="Search menu..." 
                class="text-xl"
              />
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup class="overflow-y-auto max-h-[calc(100vh-10rem)] md:max-h-[400px]">
            <template v-for="item in filteredMenuItems" :key="item.label">
              <NuxtLink v-if="item.link" :to="item.link" class="block">
                <DropdownMenuItem class="text-xl py-2">
                  <component :is="item.icon" class="mr-2 h-5 w-5" />
                  <span>{{ item.label }}</span>
                </DropdownMenuItem>
              </NuxtLink>
              <DropdownMenuItem v-else class="text-xl py-2">
                <component :is="item.icon" class="mr-2 h-5 w-5" />
                <span>{{ item.label }}</span>
              </DropdownMenuItem>
            </template>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <div class="flex-1"></div>
      <div class="flex items-center">
        <Button variant="ghost" size="icon" class="rounded-full">
          <Triangle class="h-5 w-5" />
          <span class="sr-only">Triangle</span>
        </Button>
        <Button variant="ghost" size="icon" class="rounded-full">
          <Circle class="h-5 w-5" />
          <span class="sr-only">Circle</span>
        </Button>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Add smooth scrolling for the menu group */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
}
</style> 