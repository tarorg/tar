<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
import { initDB, getAttributes, getOptions, dbStatus } from '@/services/indexedDB'

interface AttributeOption {
  value: string
  label: string
  type: string
}

interface OptionValue {
  id: number
  attribute: string
  value: string
  visual: string
  type: string
}

// Add this interface to better type the attributes from attribute.json
interface AttributeType {
  Type: string
  values: string[]
}

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

const attributes = ref<AttributeOption[]>([])
const optionValues = ref<OptionValue[]>([])
const selectedAttributes = ref<{[key: string]: string}>({
  '4': '',
  '5': '',
  '6': ''
})
const selectedOptions = ref<{[key: string]: string[]}>({
  '4': [],
  '5': [],
  '6': []
})

// Add loading state
const isLoading = ref(true)
const loadError = ref<string | null>(null)

// Update the onMounted function with proper initialization
onMounted(async () => {
  try {
    isLoading.value = true
    loadError.value = null

    // Wait for DB initialization
    await initDB()

    // Wait for DB to be ready
    while (dbStatus.value === 'loading') {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (dbStatus.value === 'error') {
      throw new Error('Database failed to initialize')
    }

    // Load data
    const [savedAttributes, savedOptions] = await Promise.all([
      getAttributes(),
      getOptions()
    ])
    
    // Map the attributes
    attributes.value = savedAttributes.map(attr => ({
      value: attr.value.toLowerCase(),
      label: attr.value,
      type: attr.type || 'text'
    }))

    optionValues.value = savedOptions

    console.log('Loaded attributes:', attributes.value)
    console.log('Loaded options:', optionValues.value)

  } catch (error) {
    console.error('Failed to load attributes and options:', error)
    loadError.value = 'Failed to load data. Please try again.'
  } finally {
    isLoading.value = false
  }
})

const getFilteredOptions = (rowNumber: string) => {
  const attribute = selectedAttributes.value[rowNumber]?.toLowerCase()
  if (!attribute) return []
  return optionValues.value.filter(option => 
    option.attribute.toLowerCase() === attribute
  )
}
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

    <div v-if="isLoading" class="flex items-center justify-center p-4">
      <div class="text-sm text-gray-500">Loading...</div>
    </div>

    <div v-else-if="loadError" class="flex items-center justify-center p-4">
      <div class="text-sm text-red-500">{{ loadError }}</div>
    </div>

    <div v-else class="flex-1 space-y-4 p-8">
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

        <!-- Attribute Rows -->
        <div v-for="rowNum in ['4', '5', '6']" :key="rowNum" class="flex items-center border-b hover:bg-gray-50">
          <!-- Attribute Dropdown Cell -->
          <div class="w-[120px] border-r flex-shrink-0">
            <Select 
              v-model="selectedAttributes[rowNum]"
              :disabled="!attributes.length"
            >
              <SelectTrigger class="w-full h-full border-0 shadow-none focus:ring-0 px-2 py-3">
                <SelectValue>
                  <template v-if="selectedAttributes[rowNum]">
                    {{ attributes.find(a => a.value === selectedAttributes[rowNum])?.label || selectedAttributes[rowNum] }}
                  </template>
                  <template v-else>
                    {{ attributes.length ? 'Select' : 'Loading...' }}
                  </template>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  v-for="attr in attributes" 
                  :key="attr.value" 
                  :value="attr.value"
                >
                  <div class="flex items-center gap-2">
                    <span>{{ attr.label }}</span>
                    <span class="text-xs text-gray-400">({{ attr.type }})</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <!-- Options Multi-Select Cell -->
          <div class="flex-1">
            <Select 
              v-model="selectedOptions[rowNum]" 
              :disabled="!selectedAttributes[rowNum]"
              multiple
            >
              <SelectTrigger class="w-full h-full border-0 shadow-none focus:ring-0 px-4 py-3">
                <SelectValue>
                  <template v-if="selectedOptions[rowNum]?.length">
                    <div class="flex flex-wrap gap-1">
                      <span 
                        v-for="value in selectedOptions[rowNum]" 
                        :key="value"
                        class="inline-flex items-center text-xs bg-primary/10 rounded px-1"
                      >
                        {{ value }}
                      </span>
                    </div>
                  </template>
                  <template v-else>
                    <span class="text-gray-400">Select values</span>
                  </template>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <template v-if="selectedAttributes[rowNum]">
                  <SelectItem
                    v-for="option in getFilteredOptions(rowNum)"
                    :key="option.id"
                    :value="option.value"
                  >
                    <div class="flex items-center gap-2">
                      <template v-if="option.type === 'color'">
                        <div 
                          class="w-4 h-4 rounded-sm" 
                          :style="{ backgroundColor: option.visual }"
                        />
                      </template>
                      <template v-else>
                        <span class="w-4 text-center">{{ option.visual }}</span>
                      </template>
                      <span>{{ option.value }}</span>
                    </div>
                  </SelectItem>
                </template>
                <div v-else class="p-2 text-sm text-gray-400">
                  Select an attribute first
                </div>
              </SelectContent>
            </Select>
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

/* Add these styles to your existing <style> section */
.max-h-[200px] {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.max-h-[200px]::-webkit-scrollbar {
  width: 6px;
}

.max-h-[200px]::-webkit-scrollbar-track {
  background: transparent;
}

.max-h-[200px]::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}
</style>






