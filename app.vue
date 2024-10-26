<template>
  <div>
    <Navbar sticky>
      <div class="flex items-center justify-between w-full px-4">
        <div class="flex items-center justify-center">
          <UiDropdownMenu>
            <UiDropdownMenuTrigger>
              <button class="p-2 border rounded hover:bg-gray-100">
                <SquareIcon class="w-6 h-6" />
              </button>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent class="w-56">
              <template v-for="(item, i) in menuitems" :key="i">
                <UiDropdownMenuLabel v-if="item.label" :label="item.label" />
                <UiDropdownMenuSeparator v-else-if="item.divider" />
                <UiDropdownMenuItem
                  v-else-if="item.title && !item.items"
                  :title="item.title"
                  :shortcut="item.shortcut"
                  :disabled="item.disabled"
                  @select="handleMenuItemSelect(item)"
                >
                  <component :is="item.icon" class="w-4 h-4 mr-2" :class="item.iconClass" />
                  {{ item.title }}
                </UiDropdownMenuItem>
                <UiDropdownMenuSub v-else-if="item.title && item.items">
                  <UiDropdownMenuSubTrigger>
                    <component :is="item.icon" class="w-4 h-4 mr-2" />
                    {{ item.title }}
                  </UiDropdownMenuSubTrigger>
                  <UiDropdownMenuSubContent>
                    <template v-for="(child, k) in item.items" :key="`child-${k}`">
                      <UiDropdownMenuSeparator v-if="child.divider" />
                      <UiDropdownMenuItem
                        v-else
                        :title="child.title"
                        :shortcut="child.shortcut"
                      >
                        <component :is="child.icon" class="w-4 h-4 mr-2" />
                        {{ child.title }}
                      </UiDropdownMenuItem>
                    </template>
                  </UiDropdownMenuSubContent>
                </UiDropdownMenuSub>
              </template>
            </UiDropdownMenuContent>
          </UiDropdownMenu>
        </div>
        <nav>
          <ul class="flex space-x-4">
            <li>
              <NuxtLink to="/orai" class="hover:text-gray-600">
                <TriangleIcon class="w-6 h-6" />
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/a" class="hover:text-gray-600">
                <CircleIcon class="w-6 h-6" />
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
    </Navbar>

    <main class="p-4">
      <NuxtPage />
    </main>

    <NuxtRouteAnnouncer />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { SquareIcon, TriangleIcon, CircleIcon, UserIcon, CreditCardIcon, SettingsIcon, KeyboardIcon, UsersIcon, UserPlusIcon, MailIcon, FacebookIcon, TwitterIcon, PlusCircleIcon, GithubIcon, LifeBuoyIcon, CloudIcon, LogOutIcon } from 'lucide-vue-next'
import Navbar from '@/components/Ui/Navbar.vue'
import UiDropdownMenu from '@/components/Ui/DropdownMenu/DropdownMenu.vue'
import UiDropdownMenuTrigger from '@/components/Ui/DropdownMenu/Trigger.vue'
import UiDropdownMenuContent from '@/components/Ui/DropdownMenu/Content.vue'
import UiDropdownMenuItem from '@/components/Ui/DropdownMenu/Item.vue'
import UiDropdownMenuLabel from '@/components/Ui/DropdownMenu/Label.vue'
import UiDropdownMenuSeparator from '@/components/Ui/DropdownMenu/Separator.vue'
import UiDropdownMenuSub from '@/components/Ui/DropdownMenu/Sub.vue'
import UiDropdownMenuSubTrigger from '@/components/Ui/DropdownMenu/SubTrigger.vue'
import UiDropdownMenuSubContent from '@/components/Ui/DropdownMenu/SubContent.vue'

const router = useRouter()

const showBookmark = ref(true);
const showFullUrls = ref(false);
const person = ref("1");

const menuitems = [
  { label: "My Account" },
  { divider: true },
  { title: "Pin", icon: SquareIcon, shortcut: "P", iconClass: "text-blue-500", route: "/pin" },
  { title: "Profile", icon: UserIcon, shortcut: "⇧⌘P" },
  { title: "Billing", icon: CreditCardIcon, shortcut: "⌘B" },
  { title: "Settings", icon: SettingsIcon, shortcut: "⌘S" },
  { title: "Keyboard shortcuts", icon: KeyboardIcon, shortcut: "⌘K" },
  { divider: true },
  { title: "Team", icon: UsersIcon, shortcut: "⇧⌘T" },
  {
    title: "Invite Users",
    icon: UserPlusIcon,
    items: [
      { title: "Email", icon: MailIcon, shortcut: "⇧⌘E" },
      { title: "Facebook", icon: FacebookIcon, shortcut: "⇧⌘F" },
      { title: "Twitter", icon: TwitterIcon, shortcut: "⇧⌘T" },
      { divider: true },
      { title: "More", icon: PlusCircleIcon },
    ],
  },
  { title: "Settings", icon: SettingsIcon, shortcut: "⌘S" },
  { title: "Keyboard shortcuts", icon: KeyboardIcon, shortcut: "⌘K" },
  { divider: true },
  { title: "Github", icon: GithubIcon },
  { title: "Support", icon: LifeBuoyIcon },
  { title: "API", icon: CloudIcon, disabled: true },
  { divider: true },
  { title: "Sign out", icon: LogOutIcon },
];

const handleMenuItemSelect = (item) => {
  if (item.route) {
    router.push(item.route)
  }
  // Add any other logic for menu item selection here
}
</script>
