<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

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

// First, add this interface near the top with other interfaces
interface SelectValue {
  value: string | string[]
}

// Update or add these interfaces at the top of the script section
interface SelectProps {
  modelValue: string | string[]
  disabled?: boolean
  multiple?: boolean
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
      value: attr.value,
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

const getFilteredOptions = (rowNum: string) => {
  const attribute = selectedAttributes.value[rowNum]
  if (!attribute) return []
  
  return optionValues.value.filter(option => 
    option.attribute === attribute
  )
}

// Update the watch section to handle type changes
watch(selectedType, (newType) => {
  if (newType === 'I') {
    // Keep only first value when switching to single select
    Object.keys(selectedOptions.value).forEach(key => {
      selectedOptions.value[key] = selectedOptions.value[key].slice(0, 1)
    })
  }
})

// Update the handler for option selection
const handleOptionSelect = (rowNum: string, value: string) => {
  if (selectedType.value === 'G') {
    const index = selectedOptions.value[rowNum].indexOf(value)
    if (index === -1) {
      selectedOptions.value[rowNum].push(value)
    } else {
      selectedOptions.value[rowNum].splice(index, 1)
    }
  } else {
    selectedOptions.value[rowNum] = [value]
  }
}

// Add this computed property
const getSelectModelValue = (rowNum: string) => {
  if (selectedType.value === 'G') {
    return selectedOptions.value[rowNum]
  }
  return selectedOptions.value[rowNum][0] || ''
}

// Update the handler
const handleSelectUpdate = (rowNum: string, value: string | string[]) => {
  if (selectedType.value === 'G') {
    selectedOptions.value[rowNum] = Array.isArray(value) ? value : [value]
  } else {
    selectedOptions.value[rowNum] = [value as string]
  }
}

// Add these refs for handling attribute changes
const showConfirmationSheet = ref(false)
const pendingAttributeChange = ref<{
  rowNum: string;
  newValue: string;
} | null>(null)

// Add these methods for handling attribute changes
const handleAttributeChange = (rowNum: string, newValue: string) => {
  if (selectedAttributes.value[rowNum] !== newValue && selectedOptions.value[rowNum].length > 0) {
    // Store pending change and show confirmation
    pendingAttributeChange.value = { rowNum, newValue }
    showConfirmationSheet.value = true
  } else {
    // If no values selected or same attribute, change directly
    applyAttributeChange(rowNum, newValue)
  }
}

const applyAttributeChange = (rowNum: string, newValue: string) => {
  selectedAttributes.value[rowNum] = newValue
  selectedOptions.value[rowNum] = [] // Reset options when attribute changes
}

const confirmAttributeChange = () => {
  if (pendingAttributeChange.value) {
    const { rowNum, newValue } = pendingAttributeChange.value
    applyAttributeChange(rowNum, newValue)
  }
  showConfirmationSheet.value = false
  pendingAttributeChange.value = null
}

const cancelAttributeChange = () => {
  showConfirmationSheet.value = false
  pendingAttributeChange.value = null
}

// Add this method to filter available attributes
const getAvailableAttributes = (currentRowNum: string) => {
  // Get all selected attributes except the current row
  const selectedValues = Object.entries(selectedAttributes.value)
    .filter(([rowNum]) => rowNum !== currentRowNum)
    .map(([_, value]) => value)

  // Filter out attributes that are already selected in other rows
  return attributes.value.filter(attr => 
    !selectedValues.includes(attr.value)
  )
}
<<<<<<< HEAD

const selectedOptionsString = (rowNum: string): string => {
  return selectedOptions.value[rowNum][0] || ''
}

const handleMultiSelectUpdate = (rowNum: string, value: string) => {
  const currentValues = selectedOptions.value[rowNum]
  const index = currentValues.indexOf(value)
  
  if (index === -1) {
    // Add value if not present
    selectedOptions.value[rowNum] = [...currentValues, value]
  } else {
    // Remove value if already present
    selectedOptions.value[rowNum] = currentValues.filter(v => v !== value)
  }
}
=======
>>>>>>> b1d2c800a5b91a0861de1d329a29da9fb37f4e33
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
      <Sheet v-model:open="showConfirmationSheet">
        <SheetContent 
          side="bottom" 
          class="h-[50vh] rounded-t-xl"
        >
          <SheetHeader>
            <SheetTitle>Change Attribute?</SheetTitle>
            <SheetDescription>
              Changing the attribute will reset its selected values. Are you sure you want to continue?
            </SheetDescription>
          </SheetHeader>
          <div class="mt-6 flex flex-col gap-4">
            <div class="flex items-center gap-2">
              <div class="text-sm font-medium">Current Attribute:</div>
              <div class="text-sm text-gray-500">
                {{ pendingAttributeChange?.rowNum && selectedAttributes[pendingAttributeChange.rowNum] }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="text-sm font-medium">New Attribute:</div>
              <div class="text-sm text-gray-500">
                {{ pendingAttributeChange?.newValue }}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="text-sm font-medium">Selected Values:</div>
              <div class="text-sm text-gray-500">
                {{ pendingAttributeChange?.rowNum && selectedOptions[pendingAttributeChange.rowNum].join(', ') }}
              </div>
            </div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 p-6 bg-white border-t">
            <div class="flex justify-end gap-2">
              <Button variant="outline" @click="cancelAttributeChange">
                Cancel
              </Button>
              <Button @click="confirmAttributeChange">
                Confirm Change
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
              :model-value="selectedAttributes[rowNum]"
              @update:model-value="handleAttributeChange(rowNum, $event)"
              :disabled="!attributes.length"
            >
              <SelectTrigger class="w-full h-full border-0 shadow-none focus:ring-0 px-2 py-3">
                <SelectValue>
                  <template v-if="selectedAttributes[rowNum]">
                    {{ attributes.find(a => a.value === selectedAttributes[rowNum])?.label }}
                  </template>
                  <template v-else>
                    {{ attributes.length ? 'Select' : 'Loading...' }}
                  </template>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  v-for="attr in getAvailableAttributes(rowNum)" 
                  :key="attr.value" 
                  :value="attr.value"
                >
                  <span>{{ attr.label }}</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <!-- Options Multi-Select Cell -->
          <div class="flex-1">
            <Select 
              v-if="selectedType === 'G'"
              :model-value="selectedOptionsString(rowNum)"
              @update:model-value="handleMultiSelectUpdate(rowNum, $event)"
              :disabled="!selectedAttributes[rowNum]"
            >
              <SelectTrigger class="w-full h-full border-0 shadow-none focus:ring-0 px-4 py-3">
                <SelectValue>
                  <template v-if="selectedOptions[rowNum]?.length">
                    <div class="flex flex-wrap gap-1.5">
                      <span 
                        v-for="value in selectedOptions[rowNum]" 
                        :key="value"
                        class="inline-flex items-center text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5"
                      >
                        {{ value }}
                      </span>
                    </div>
                  </template>
                  <template v-else>
                    <span class="text-gray-400">Select multiple values</span>
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
<<<<<<< HEAD
=======
                      <!-- Show selected state -->
>>>>>>> b1d2c800a5b91a0861de1d329a29da9fb37f4e33
                      <span v-if="selectedOptions[rowNum].includes(option.value)" class="ml-auto">✓</span>
                    </div>
                  </SelectItem>
                </template>
                <div v-else class="p-2 text-sm text-gray-400">
                  Select an attribute first
                </div>
              </SelectContent>
            </Select>

            <Select 
              v-else
              :model-value="selectedOptions[rowNum][0] || ''"
              @update:model-value="(val) => selectedOptions[rowNum] = [val]"
              :disabled="!selectedAttributes[rowNum]"
            >
              <SelectTrigger class="w-full h-full border-0 shadow-none focus:ring-0 px-4 py-3">
                <SelectValue>
                  <template v-if="selectedOptions[rowNum]?.length">
                    <span>{{ selectedOptions[rowNum][0] }}</span>
                  </template>
                  <template v-else>
                    <span class="text-gray-400">Select a value</span>
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

/* Update the scrollbar styles */
.\[\.max-h-\[200px\]\] {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.\[\.max-h-\[200px\]\]::-webkit-scrollbar {
  width: 6px;
}

.\[\.max-h-\[200px\]\]::-webkit-scrollbar-track {
  background: transparent;
}

.\[\.max-h-\[200px\]\]::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}

/* Alternative approach using a regular class name */
.scroll-container {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
  max-height: 200px;
}

.scroll-container::-webkit-scrollbar {
  width: 6px;
}

.scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.scroll-container::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}
</style>






