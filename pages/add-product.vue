<script setup lang="ts">
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue'
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
  ChevronRight,
} from 'lucide-vue-next'
import { initDB, getAttributes, getOptions, dbStatus } from '@/services/indexedDB'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Paragraph from '@editorjs/paragraph'

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

// Add these interfaces after the existing interfaces
interface GeneratedSku {
  sku: string
  combination: string[]
  stock: number
}

// Add these interfaces
interface SkuDetails {
  upc: string
  images: string[]
  collection: string
  cost: number
  price: number
  max: number
  stock: number
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

// Replace the existing generatedSkus computed property with this updated version
const generatedSkus = computed(() => {
  // Only proceed if we have name and category
  if (!productName.value || !category.value) {
    return []
  }

  // Get selected attributes (rows 4,5,6 that have both attribute and values selected)
  const selectedAttrs = ['4', '5', '6'].filter(row => 
    selectedAttributes.value[row] && 
    selectedOptions.value[row] && 
    selectedOptions.value[row].length > 0
  )

  if (selectedAttrs.length === 0) {
    return []
  }

  // Get all possible combinations
  const combinations: string[][] = []
  
  const generateCombinations = (current: string[], index: number) => {
    if (index === selectedAttrs.length) {
      combinations.push([...current])
      return
    }
    
    const rowNum = selectedAttrs[index]
    const attribute = selectedAttributes.value[rowNum]
    const values = selectedOptions.value[rowNum]

    for (const value of values) {
      // Include both attribute and value in the combination
      current.push(`${attribute}:${value}`)
      generateCombinations(current, index + 1)
      current.pop()
    }
  }
  
  generateCombinations([], 0)
  
  // Generate SKUs for each combination
  return combinations.map(combination => {
    const namePrefix = productName.value.slice(0, 3).toUpperCase()
    const typeIndicator = selectedType.value
    const categoryPrefix = category.value.slice(0, 3).toUpperCase()
    
    // Create attribute suffix by taking first 3 letters of each value
    const attributeSuffix = combination.map(pair => {
      const [attr, value] = pair.split(':')
      return value.slice(0, 3).toUpperCase()
    }).join('')
    
    return {
      sku: `${namePrefix}-${typeIndicator}-${categoryPrefix}-${attributeSuffix}`,
      combination: combination.map(pair => {
        const [attr, value] = pair.split(':')
        return `${attr}: ${value}`
      }),
      stock: 0
    }
  })
})

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

// Add these methods to handle multi-select
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

// Add these refs
const showDescriptionSheet = ref(false)
const editor = ref<EditorJS | null>(null)
const editorData = ref({})

// Add this function to initialize Editor.js
const initEditor = () => {
  if (editor.value) return

  editor.value = new EditorJS({
    holder: 'editor',
    tools: {
      header: {
        class: Header,
        config: {
          levels: [2, 3, 4],
          defaultLevel: 3
        }
      },
      list: {
        class: List,
        inlineToolbar: true
      },
      paragraph: {
        class: Paragraph,
        inlineToolbar: true
      }
    },
    data: editorData.value,
    onChange: async () => {
      editorData.value = await editor.value?.save() || {}
    }
  })
}

// Add cleanup function
onBeforeUnmount(() => {
  editor.value?.destroy()
  editor.value = null
})

// Add handler for opening description sheet
const openDescriptionEditor = () => {
  showDescriptionSheet.value = true
  // Initialize editor after sheet is opened
  nextTick(() => {
    initEditor()
  })
}

// Add these refs
const showSkuSheet = ref(false)
const selectedSku = ref<GeneratedSku | null>(null)
const skuDetails = ref<{ [key: string]: SkuDetails }>({})
const skuFileInput = ref<HTMLInputElement | null>(null)

// Add these methods
const handleSkuImageUpload = (event: Event, sku: string) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        if (!skuDetails.value[sku]) {
          skuDetails.value[sku] = {
            upc: '',
            images: [],
            collection: '',
            cost: 0,
            price: 0,
            max: 0,
            stock: 0
          }
        }
        skuDetails.value[sku].images.push(e.target.result as string)
      }
    }
    reader.readAsDataURL(input.files[0])
  }
}

const openSkuDetails = (sku: GeneratedSku) => {
  selectedSku.value = sku
  if (!skuDetails.value[sku.sku]) {
    skuDetails.value[sku.sku] = {
      upc: '',
      images: [],
      collection: '',
      cost: 0,
      price: 0,
      max: 0,
      stock: 0
    }
  }
  showSkuSheet.value = true
}

const triggerSkuFileInput = () => {
  skuFileInput.value?.click()
}

// Add this method to handle number input changes
const handleSkuNumberInput = (sku: string, field: keyof SkuDetails, value: string) => {
  if (!skuDetails.value[sku]) {
    skuDetails.value[sku] = {
      upc: '',
      images: [],
      collection: '',
      cost: 0,
      price: 0,
      max: 0,
      stock: 0
    }
  }
  skuDetails.value[sku][field] = Number(value)
}

// Add this method to handle string input changes
const handleSkuStringInput = (sku: string, field: keyof SkuDetails, value: string) => {
  if (!skuDetails.value[sku]) {
    skuDetails.value[sku] = {
      upc: '',
      images: [],
      collection: '',
      cost: 0,
      price: 0,
      max: 0,
      stock: 0
    }
  }
  skuDetails.value[sku][field] = value
}
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Fixed Header -->
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

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="isLoading" class="flex items-center justify-center p-4">
        <div class="text-sm text-gray-500">Loading...</div>
      </div>

      <div v-else-if="loadError" class="flex items-center justify-center p-4">
        <div class="text-sm text-red-500">{{ loadError }}</div>
      </div>

      <div v-else class="p-8 space-y-4">
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
            
            <div class="flex-1 flex items-center">
              <input
                v-model="productName"
                type="text"
                placeholder="name"
                class="w-full py-3 px-4 bg-transparent border-0 focus:outline-none placeholder:text-gray-400 text-sm"
              />
              <button 
                @click="openDescriptionEditor"
                class="px-3 py-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronRight class="h-4 w-4 text-gray-400" />
              </button>
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
                  <ChevronDown class="h-4 w-4 opacity-0" />
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
                  <ChevronDown class="h-4 w-4 opacity-0" />
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
                  <ChevronDown class="h-4 w-4 opacity-0" />
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

        <!-- Replace the existing SKU table with this -->
        <div class="border-t">
          <div>
            <template v-if="generatedSkus.length">
              <div 
                v-for="(item, index) in generatedSkus" 
                :key="index"
                class="border-t first:border-t-0"
              >
                <div 
                  class="p-3 hover:bg-gray-50/50 cursor-pointer grid grid-cols-[1fr,100px]"
                  @click="openSkuDetails(item)"
                >
                  <div>
                    <div class="text-sm font-medium">
                      {{ item.sku }}
                    </div>
                    <div class="mt-1 text-xs text-gray-500">
                      {{ category }} {{ item.combination.map(pair => pair.split(': ')[1]).join(' ') }}
                    </div>
                  </div>
                  <div class="flex items-center">
                    <Input
                      v-model="item.stock"
                      type="number"
                      min="0"
                      class="w-full h-8 text-sm"
                      placeholder="0"
                      @click.stop
                    />
                  </div>
                </div>
              </div>
            </template>
            <div 
              v-else 
              class="p-3 text-sm text-gray-500 text-center"
            >
              Enter product name, category and select attribute values to generate SKUs
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Keep the Sheet component outside the scrollable area -->
    <Sheet v-model:open="showConfirmationSheet">
      <!-- ... Sheet content remains the same ... -->
    </Sheet>

    <Sheet v-model:open="showDescriptionSheet">
      <SheetContent side="right" class="w-[90vw] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Product Description</SheetTitle>
          <SheetDescription>
            Add a detailed description for your product
          </SheetDescription>
        </SheetHeader>
        
        <div class="mt-6 space-y-6">
          <div id="editor" class="min-h-[300px] border rounded-md" />
        </div>
        
        <div class="absolute bottom-0 left-0 right-0 p-6 bg-white border-t">
          <div class="flex justify-end gap-2">
            <Button 
              variant="outline" 
              @click="showDescriptionSheet = false"
            >
              Cancel
            </Button>
            <Button 
              @click="showDescriptionSheet = false"
            >
              Save
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <Sheet v-model:open="showSkuSheet">
      <SheetContent side="bottom" class="h-[80vh]">
        <SheetHeader>
          <SheetTitle>SKU Details</SheetTitle>
          <SheetDescription>
            {{ selectedSku?.sku }}
          </SheetDescription>
        </SheetHeader>

        <div class="mt-6">
          <!-- Table3 -->
          <div class="border rounded-lg overflow-hidden">
            <!-- UPC Row -->
            <div class="flex items-center border-b hover:bg-gray-50">
              <div class="w-32 border-r p-3">
                <div class="text-sm font-medium">UPC</div>
              </div>
              <div class="flex-1 p-2">
                <Input
                  :value="skuDetails[selectedSku?.sku || '']?.upc"
                  class="w-full"
                  placeholder="Enter UPC"
                  @input="(e) => handleSkuStringInput(selectedSku?.sku || '', 'upc', (e.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <!-- Images Row -->
            <div class="flex items-center border-b hover:bg-gray-50">
              <div class="w-32 border-r p-3">
                <div class="text-sm font-medium">Images</div>
              </div>
              <div class="flex-1 p-2">
                <div class="flex items-center gap-2 overflow-x-auto">
                  <div 
                    v-for="(image, index) in skuDetails[selectedSku?.sku || '']?.images" 
                    :key="index"
                    class="flex-shrink-0 w-12 h-12 rounded border overflow-hidden"
                  >
                    <img 
                      :src="image" 
                      class="w-full h-full object-cover"
                      alt="SKU image"
                    />
                  </div>
                  <button 
                    @click="triggerSkuFileInput"
                    class="flex-shrink-0 w-12 h-12 rounded border border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    <Plus class="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <input
                  ref="skuFileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="(e) => handleSkuImageUpload(e, selectedSku?.sku || '')"
                />
              </div>
            </div>

            <!-- Collection Row -->
            <div class="flex items-center border-b hover:bg-gray-50">
              <div class="w-32 border-r p-3">
                <div class="text-sm font-medium">Collection</div>
              </div>
              <div class="flex-1 p-2">
                <Input
                  :value="skuDetails[selectedSku?.sku || '']?.collection"
                  class="w-full"
                  placeholder="Enter collection"
                  @input="(e) => handleSkuStringInput(selectedSku?.sku || '', 'collection', (e.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <!-- Cost Row -->
            <div class="flex items-center border-b hover:bg-gray-50">
              <div class="w-32 border-r p-3">
                <div class="text-sm font-medium">Cost</div>
              </div>
              <div class="flex-1 p-2">
                <Input
                  :value="skuDetails[selectedSku?.sku || '']?.cost"
                  type="number"
                  class="w-full"
                  placeholder="0.00"
                  @input="(e) => handleSkuNumberInput(selectedSku?.sku || '', 'cost', (e.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <!-- Price Row -->
            <div class="flex items-center border-b hover:bg-gray-50">
              <div class="w-32 border-r p-3">
                <div class="text-sm font-medium">Price</div>
              </div>
              <div class="flex-1 p-2">
                <Input
                  :value="skuDetails[selectedSku?.sku || '']?.price"
                  type="number"
                  class="w-full"
                  placeholder="0.00"
                  @input="(e) => handleSkuNumberInput(selectedSku?.sku || '', 'price', (e.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <!-- Max Row -->
            <div class="flex items-center border-b hover:bg-gray-50">
              <div class="w-32 border-r p-3">
                <div class="text-sm font-medium">Max</div>
              </div>
              <div class="flex-1 p-2">
                <Input
                  :value="skuDetails[selectedSku?.sku || '']?.max"
                  type="number"
                  class="w-full"
                  placeholder="0"
                  @input="(e) => handleSkuNumberInput(selectedSku?.sku || '', 'max', (e.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <!-- Stock Row -->
            <div class="flex items-center border-b hover:bg-gray-50">
              <div class="w-32 border-r p-3">
                <div class="text-sm font-medium">Stock</div>
              </div>
              <div class="flex-1 p-2">
                <Input
                  :value="skuDetails[selectedSku?.sku || '']?.stock"
                  type="number"
                  class="w-full"
                  placeholder="0"
                  @input="(e) => handleSkuNumberInput(selectedSku?.sku || '', 'stock', (e.target as HTMLInputElement).value)"
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
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

:deep(.select-trigger svg) {
  @apply opacity-100;
}

.w-[120px] :deep(.select-trigger svg),
.flex-1 :deep(.select-trigger svg) {
  @apply opacity-0;
}

/* Add these styles for better scrolling */
.overflow-y-auto {
  -webkit-overflow-scrolling: touch;
}

/* Add to your existing styles */
:deep(.codex-editor) {
  @apply h-full;
}

:deep(.ce-block__content) {
  @apply max-w-none mx-4;
}

:deep(.ce-toolbar__content) {
  @apply max-w-none mx-4;
}

:deep(.codex-editor__redactor) {
  @apply pb-16;
}
</style>






