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
  FolderClosed,
} from 'lucide-vue-next'

const menuSearchQuery = ref('')

const menuItems = [
  { icon: ShoppingCart, label: 'Sales', link: '/sales' },
  {
    icon: Package, 
    label: 'Inventory',
    submenu: [
      { icon: Package, label: 'Products', link: '/products' },
      { icon: Layers, label: 'Stocks', link: '/stocks' },
      { icon: Settings, label: 'Options', link: '/options' },
      { icon: FolderClosed, label: 'Collections', link: '/collections' }
    ]
  },
  { icon: BarChart, label: 'Reports', link: '/reports' },
  {
    icon: Settings,
    label: 'Settings',
    submenu: [
      { icon: User, label: 'Profile', link: '/profile' },
      { icon: Settings, label: 'Options', link: '/settings' }
    ]
  },
]

const filteredMenuItems = computed(() => {
  const searchTerm = menuSearchQuery.value.toLowerCase()
  return menuItems.filter(item => {
    // Check main item
    if (item.label.toLowerCase().includes(searchTerm)) return true
    // Check submenu items if they exist
    if (item.submenu) {
      return item.submenu.some(subItem => 
        subItem.label.toLowerCase().includes(searchTerm)
      )
    }
    return false
  })
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
              <template v-if="!item.submenu">
                <NuxtLink v-if="item.link" :to="item.link" class="block">
                  <DropdownMenuItem class="text-xl py-2">
                    <component :is="item.icon" class="mr-2 h-5 w-5" />
                    <span>{{ item.label }}</span>
                  </DropdownMenuItem>
                </NuxtLink>
              </template>
              <template v-else>
                <DropdownMenuItem class="text-xl py-2">
                  <component :is="item.icon" class="mr-2 h-5 w-5" />
                  <span>{{ item.label }}</span>
                </DropdownMenuItem>
                <template v-for="subItem in item.submenu" :key="subItem.label">
                  <NuxtLink :to="subItem.link" class="block pl-10">
                    <DropdownMenuItem class="text-xl py-2">
                      <component :is="subItem.icon" class="mr-2 h-5 w-5" />
                      <span>{{ subItem.label }}</span>
                    </DropdownMenuItem>
                  </NuxtLink>
                </template>
              </template>
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
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
}
</style> 