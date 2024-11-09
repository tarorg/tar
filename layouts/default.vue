<script setup lang="ts">
import { useAuthRedirect } from '~/composables/useAuthRedirect'

// Setup auth redirect handling
useAuthRedirect()
</script>

<template>
  <div class="min-h-screen bg-background">
    <MainNav />
    <main>
      <slot />
    </main>
  </div>
</template> 