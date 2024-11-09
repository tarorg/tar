<script setup lang="ts">
import { ref, computed } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Activity,
  ArrowUpRight,
  BarChart,
  Circle,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Square,
  Triangle,
  User,
  Users,
  Layers,
} from 'lucide-vue-next'
import { NuxtLink } from '#components'

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
  <div class="flex flex-col min-h-screen w-full">
    <header class="sticky top-0 flex h-16 items-center border-b bg-white px-2 md:px-6 z-10">
      <div class="flex w-full items-center">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="secondary" size="icon" class="rounded-full">
              <Square class="h-5 w-5" />
              <span class="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-screen md:w-56">
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
            <DropdownMenuGroup>
              <template v-for="item in filteredMenuItems" :key="item.label">
                <DropdownMenuItem class="text-xl py-2">
                  <component :is="item.icon" class="mr-2 h-5 w-5" />
                  <span v-if="item.link">
                    <NuxtLink :to="item.link" class="flex items-center">
                      {{ item.label }}
                    </NuxtLink>
                  </span>
                  <span v-else>{{ item.label }}</span>
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
    <main class="flex-1 overflow-auto px-0 py-4 sm:p-4 md:p-6 lg:p-8">
      <div class="container mx-auto max-w-7xl">
        <div class="grid gap-4 md:gap-6 lg:gap-8">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign class="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">
                  $45,231.89
                </div>
                <p class="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium">
                  Subscriptions
                </CardTitle>
                <Users class="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">
                  +2350
                </div>
                <p class="text-xs text-muted-foreground">
                  +180.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium">
                  Sales
                </CardTitle>
                <CreditCard class="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">
                  +12,234
                </div>
                <p class="text-xs text-muted-foreground">
                  +19% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle class="text-sm font-medium">
                  Active Now
                </CardTitle>
                <Activity class="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div class="text-2xl font-bold">
                  +573
                </div>
                <p class="text-xs text-muted-foreground">
                  +201 since last hour
                </p>
              </CardContent>
            </Card>
          </div>
          <div class="grid gap-4 lg:grid-cols-7">
            <Card class="lg:col-span-5">
              <CardHeader class="flex flex-row items-center">
                <div class="grid gap-2">
                  <CardTitle>Transactions</CardTitle>
                  <CardDescription>
                    Recent transactions from your store.
                  </CardDescription>
                </div>
                <Button as-child size="sm" class="ml-auto gap-1">
                  <a href="#">
                    View All
                    <ArrowUpRight class="h-4 w-4" />
                  </a>
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead class="hidden xl:table-column">
                        Type
                      </TableHead>
                      <TableHead class="hidden xl:table-column">
                        Status
                      </TableHead>
                      <TableHead class="hidden xl:table-column">
                        Date
                      </TableHead>
                      <TableHead class="text-right">
                        Amount
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <div class="font-medium">
                          Liam Johnson
                        </div>
                        <div class="hidden text-sm text-muted-foreground md:inline">
                          liam@example.com
                        </div>
                      </TableCell>
                      <TableCell class="hidden xl:table-column">
                        Sale
                      </TableCell>
                      <TableCell class="hidden xl:table-column">
                        <Badge class="text-xs" variant="outline">
                          Approved
                        </Badge>
                      </TableCell>
                      <TableCell class="hidden md:table-cell lg:hidden xl:table-column">
                        2023-06-23
                      </TableCell>
                      <TableCell class="text-right">
                        $250.00
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div class="font-medium">
                          Olivia Smith
                        </div>
                        <div class="hidden text-sm text-muted-foreground md:inline">
                          olivia@example.com
                        </div>
                      </TableCell>
                      <TableCell class="hidden xl:table-column">
                        Refund
                      </TableCell>
                      <TableCell class="hidden xl:table-column">
                        <Badge class="text-xs" variant="outline">
                          Declined
                        </Badge>
                      </TableCell>
                      <TableCell class="hidden md:table-cell lg:hidden xl:table-column">
                        2023-06-24
                      </TableCell>
                      <TableCell class="text-right">
                        $150.00
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div class="font-medium">
                          Noah Williams
                        </div>
                        <div class="hidden text-sm text-muted-foreground md:inline">
                          noah@example.com
                        </div>
                      </TableCell>
                      <TableCell class="hidden xl:table-column">
                        Subscription
                      </TableCell>
                      <TableCell class="hidden xl:table-column">
                        <Badge class="text-xs" variant="outline">
                          Approved
                        </Badge>
                      </TableCell>
                      <TableCell class="hidden md:table-cell lg:hidden xl:table-column">
                        2023-06-25
                      </TableCell>
                      <TableCell class="text-right">
                        $350.00
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div class="font-medium">
                          Emma Brown
                        </div>
                        <div class="hidden text-sm text-muted-foreground md:inline">
                          emma@example.com
                        </div>
                      </TableCell>
                      <TableCell class="hidden xl:table-column">
                        Sale
                      </TableCell>
                      <TableCell class="hidden xl:table-column">
                        <Badge class="text-xs" variant="outline">
                          Approved
                        </Badge>
                      </TableCell>
                      <TableCell class="hidden md:table-cell lg:hidden xl:table-column">
                        2023-06-26
                      </TableCell>
                      <TableCell class="text-right">
                        $450.00
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div class="font-medium">
                          Liam Johnson
                        </div>
                        <div class="hidden text-sm text-muted-foreground md:inline">
                          liam@example.com
                        </div>
                      </TableCell>
                      <TableCell class="hidden xl:table-column">
                        Sale
                      </TableCell>
                      <TableCell class="hidden xl:table-column">
                        <Badge class="text-xs" variant="outline">
                          Approved
                        </Badge>
                      </TableCell>
                      <TableCell class="hidden md:table-cell lg:hidden xl:table-column">
                        2023-06-27
                      </TableCell>
                      <TableCell class="text-right">
                        $550.00
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card class="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
              </CardHeader>
              <CardContent class="grid gap-8">
                <div class="flex items-center gap-4">
                  <Avatar class="hidden h-9 w-9 sm:flex">
                    <AvatarFallback>OM</AvatarFallback>
                  </Avatar>
                  <div class="grid gap-1">
                    <p class="text-sm font-medium leading-none">
                      Olivia Martin
                    </p>
                    <p class="text-sm text-muted-foreground">
                      olivia.martin@email.com
                    </p>
                  </div>
                  <div class="ml-auto font-medium">
                    +$1,999.00
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <Avatar class="hidden h-9 w-9 sm:flex">
                    <AvatarFallback>JL</AvatarFallback>
                  </Avatar>
                  <div class="grid gap-1">
                    <p class="text-sm font-medium leading-none">
                      Jackson Lee
                    </p>
                    <p class="text-sm text-muted-foreground">
                      jackson.lee@email.com
                    </p>
                  </div>
                  <div class="ml-auto font-medium">
                    +$39.00
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <Avatar class="hidden h-9 w-9 sm:flex">
                    <AvatarFallback>IN</AvatarFallback>
                  </Avatar>
                  <div class="grid gap-1">
                    <p class="text-sm font-medium leading-none">
                      Isabella Nguyen
                    </p>
                    <p class="text-sm text-muted-foreground">
                      isabella.nguyen@email.com
                    </p>
                  </div>
                  <div class="ml-auto font-medium">
                    +$299.00
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <Avatar class="hidden h-9 w-9 sm:flex">
                    <AvatarFallback>WK</AvatarFallback>
                  </Avatar>
                  <div class="grid gap-1">
                    <p class="text-sm font-medium leading-none">
                      William Kim
                    </p>
                    <p class="text-sm text-muted-foreground">
                      will@email.com
                    </p>
                  </div>
                  <div class="ml-auto font-medium">
                    +$99.00
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <Avatar class="hidden h-9 w-9 sm:flex">
                    <AvatarFallback>SD</AvatarFallback>
                  </Avatar>
                  <div class="grid gap-1">
                    <p class="text-sm font-medium leading-none">
                      Sofia Davis
                    </p>
                    <p class="text-sm text-muted-foreground">
                      sofia.davis@email.com
                    </p>
                  </div>
                  <div class="ml-auto font-medium">
                    +$39.00
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Ensure the page takes up full height */
html, body, #__nuxt, #__layout {
  height: 100%;
}

.text-xl {
  font-size: 20px;
}
</style>

