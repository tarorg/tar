<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  X,
  Save,
  Plus,
  Image as ImageIcon,
  ChevronDown,
} from 'lucide-vue-next'

const goBack = () => {
  navigateTo('/products')
}

const saveProduct = () => {
  // Add save functionality here
  goBack()
}

const selectedType = ref('G')
const productName = ref('')
const primaryImage = ref<string>('')
const additionalImages = ref<string[]>([])
const primaryFileInput = ref<HTMLInputElement | null>(null)
const additionalFileInput = ref<HTMLInputElement | null>(null)

const toggleType = () => {
  selectedType.value = selectedType.value === 'G' ? 'I' : 'G'
}

const handlePrimaryImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        primaryImage.value = e.target.result as string
      }
    }
    reader.readAsDataURL(input.files[0])
  }
}

const handleAdditionalImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        additionalImages.value.push(e.target.result as string)
      }
    }
    reader.readAsDataURL(input.files[0])
  }
}

const triggerPrimaryFileInput = () => {
  primaryFileInput.value?.click()
}

const triggerAdditionalFileInput = () => {
  additionalFileInput.value?.click()
}

const selectedUnit = ref('pcs')
const category = ref('')

const units = [
  'pcs',
  'kg',
  'g',
  'l',
  'ml',
  'box',
  'set',
  'm',
  'cm',
]
</script>

<template>
  <div class="flex flex-col min-h-screen w-full">
    <header class="sticky top-0 flex h-16 items-center justify-between border-b bg-white px-2 md:px-6 z-10">
      <div class="flex items-center">
        <Button variant="ghost" size="icon" class="mr-2" @click="goBack">
          <ArrowLeft class="h-5 w-5" />
          <span class="sr-only">Go back</span>
        </Button>
        <h1 class="text-sm font-semibold">Add Product</h1>
      </div>
      <div class="flex items-center space-x-2">
        <Button @click="goBack" variant="ghost" size="icon">
          <X class="h-5 w-5" />
          <span class="sr-only">Cancel</span>
        </Button>
        <Button @click="saveProduct" variant="ghost" size="icon">
          <Save class="h-5 w-5" />
          <span class="sr-only">Save Product</span>
        </Button>
      </div>
    </header>

    <div class="flex-1 space-y-4 p-8">
      <div class="space-y-4">
        <h2 class="text-2xl font-bold tracking-tight">Add New Product</h2>
        <p class="text-muted-foreground">
          Fill in the details below to add a new product.
        </p>
      </div>

      <!-- Notion-like table -->
      <div class="mt-8 border rounded-lg overflow-hidden">
        <!-- Name Row -->
        <div class="flex items-center border-b hover:bg-gray-50">
          <div class="w-16 border-r">
            <button 
              @click="toggleType"
              class="w-full h-full px-2 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 focus:outline-none"
            >
              {{ selectedType }}
            </button>
          </div>
          
          <div class="flex-1">
            <input
              v-model="productName"
              type="text"
              placeholder="name"
              class="w-full py-3 px-4 bg-transparent border-0 focus:outline-none placeholder:text-gray-400 text-sm"
            />
          </div>
        </div>

        <!-- Images Row -->
        <div class="flex items-center border-b hover:bg-gray-50">
          <!-- Primary Image Cell -->
          <div class="w-16 border-r p-2">
            <button 
              @click="triggerPrimaryFileInput"
              class="w-12 h-12 rounded border flex items-center justify-center hover:bg-gray-50 relative overflow-hidden"
              :class="{ 'border-dashed border-gray-300': !primaryImage }"
            >
              <template v-if="primaryImage">
                <img 
                  :src="primaryImage" 
                  class="w-full h-full object-cover"
                  alt="Primary image"
                />
              </template>
              <ImageIcon v-else class="w-4 h-4 text-gray-400" />
            </button>
            <input
              ref="primaryFileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handlePrimaryImageUpload"
            />
          </div>
          
          <!-- Additional Images Cell -->
          <div class="flex-1 p-2">
            <div class="flex items-center gap-2 overflow-x-auto">
              <!-- Uploaded Images -->
              <div 
                v-for="(image, index) in additionalImages" 
                :key="index"
                class="flex-shrink-0 w-12 h-12 rounded border overflow-hidden"
              >
                <img 
                  :src="image" 
                  class="w-full h-full object-cover"
                  alt="Additional image"
                />
              </div>
              
              <!-- Add Image Button -->
              <button 
                @click="triggerAdditionalFileInput"
                class="flex-shrink-0 w-12 h-12 rounded border border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                <Plus class="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <input
              ref="additionalFileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleAdditionalImageUpload"
            />
          </div>
        </div>

        <!-- Units and Category Row -->
        <div class="flex items-center border-b hover:bg-gray-50">
          <!-- Units Dropdown Cell -->
          <div class="w-16 border-r">
            <Select v-model="selectedUnit">
              <SelectTrigger class="w-full h-full border-0 shadow-none focus:ring-0 px-2 py-3">
                <SelectValue :placeholder="selectedUnit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  v-for="unit in units" 
                  :key="unit" 
                  :value="unit"
                >
                  {{ unit }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <!-- Category Input Cell -->
          <div class="flex-1">
            <input
              v-model="category"
              type="text"
              placeholder="category"
              class="w-full py-3 px-4 bg-transparent border-0 focus:outline-none placeholder:text-gray-400 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hover\:bg-gray-50:hover input {
  background-color: transparent;
}

.overflow-x-auto {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.overflow-x-auto::-webkit-scrollbar {
  display: none;
}

.dropdown-content {
  @apply absolute left-0 mt-1 w-full bg-white border rounded-md shadow-lg z-50;
}

.dropdown-item {
  @apply px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer;
}

:deep(.select-trigger) {
  @apply border-0 shadow-none;
}

:deep(.select-content) {
  @apply min-w-[100px];
}
</style>






