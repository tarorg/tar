<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
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
  Video as VideoIcon,
} from 'lucide-vue-next'
import { initDB, getAttributes, getOptions, dbStatus } from '@/services/indexedDB'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type EditorJS from '@editorjs/editorjs'

// Get the product ID from the route
const route = useRoute()
const productId = route.params.id

// Add loading and error states
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const isSaving = ref(false)

// Add all the refs needed for form data
const selectedType = ref('I')
const productName = ref('')
const category = ref('')
const selectedUnit = ref('pcs')
const primaryMedia = ref<MediaItem | null>(null)
const additionalMedia = ref<MediaItem[]>([])
const product = ref<Product | null>(null)

// Add these refs
const primaryFileInput = ref<HTMLInputElement | null>(null)
const additionalFileInput = ref<HTMLInputElement | null>(null)
const showConfirmationSheet = ref(false)
const showDescriptionSheet = ref(false)
const showSkuSheet = ref(false)
const showSkuDetailsSheet = ref(false)
const showDatePickerSheet = ref(false)
const showStockManagementSheet = ref(false)
const showMediaPreviewSheet = ref(false)

const editor = ref<EditorJS | null>(null)
const editorData = ref<EditorData>({
  time: Date.now(),
  blocks: [],
  version: '2.28.2'
})

const selectedSku = ref<GeneratedSku | null>(null)
const selectedSkuDetails = ref<GeneratedSku | null>(null)
const selectedSkuForStock = ref<GeneratedSku | null>(null)
const selectedDate = ref('')
const selectedRowIndex = ref<number | null>(null)
const selectedMediaPreview = ref<MediaPreview | null>(null)

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

const stockDetails = ref<{ [key: string]: StockDetails }>({})
const skuDetailsData = ref<{ [key: string]: SkuDetails }>({})
const skuMedia = ref<{ [key: string]: { primary: MediaItem | null; additional: MediaItem[] } }>({})

// Add these constants
const R2_BASE_URL = 'https://pub-645e6a6aec9743558410b2ba6cedc346.r2.dev'
const acceptedFileTypes = "image/*,video/*"
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

// Add interfaces
interface MediaItem {
  url: string
  mediaType: 'image' | 'video'
}

interface Product {
  id: number
  type: string
  product_name: string
  description: string
  medias: {
    primary: MediaItem | null
    additional: MediaItem[]
  }
  unit: string
  category: string
  option1: string | null
  option2: string | null
  option3: string | null
  totalstock: number
  items: {
    SKU: string
    desc: string
    upc: string
    medias: string
    collection: string
    cost: number
    price: number
    MRP: number
    stock: number
  }[]
  created_at: string
  updated_at: string
}

// Add these interfaces after the existing MediaItem interface
interface EditorBlock {
  data: {
    text?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface EditorData {
  time: number;
  blocks: EditorBlock[];
  version: string;
}

interface GeneratedSku {
  sku: string;
  combination: string[];
  stock: number;
}

interface StockDetails {
  rows: StockRow[];
}

interface StockRow {
  group: string;
  stock: number;
  dom: string;
  shelfLife: string;
}

interface MediaPreview {
  url: string;
  mediaType: 'image' | 'video';
  type: 'primary' | 'additional';
  index?: number;
}

interface AttributeOption {
  value: string;
  label: string;
  type: string;
}

interface OptionValue {
  id: number;
  attribute: string;
  value: string;
  visual: string;
  type: string;
}

interface SkuDetails {
  upc: string;
  collection: string;
  cost: number;
  price: number;
  mrp: number;
}

// Update the fetchProduct function to sync options and SKUs
const fetchProduct = async () => {
  try {
    isLoading.value = true
    loadError.value = null

    const url = "https://commerce-tarframework.turso.io/v2/pipeline"
    const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Mjk2NzQwNjQsImlkIjoiN2ZiNTFhMTgtYjU1My00Y2M2LTkwZWItZDE0ZTcxNDI5ODlhIn0.zxIjODPlBzNcAgQQ70xZj2sI7j7RSAHpYPQUtvyoAHDb4nLGzHAPiVvnJ6qeK7-00F8A6Lz__CSPjdITPZ31BQ"

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [{
          type: "execute",
          stmt: {
            sql: "SELECT * FROM products WHERE id = ?",
            args: [{ type: 'integer', value: productId }]
          }
        }]
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    const productData = result?.results?.[0]?.response?.result?.rows?.[0]

    if (!productData) {
      throw new Error('Product not found')
    }

    // Map the row data to product object
    product.value = {
      id: Number(productData[0].value),
      type: productData[1].value,
      product_name: productData[2].value,
      description: productData[3].value,
      medias: JSON.parse(productData[4].value),
      unit: productData[5].value,
      category: productData[6].value,
      option1: productData[7].value ? JSON.parse(productData[7].value) : null,
      option2: productData[8].value ? JSON.parse(productData[8].value) : null,
      option3: productData[9].value ? JSON.parse(productData[9].value) : null,
      totalstock: Number(productData[10].value),
      items: JSON.parse(productData[11].value),
      created_at: productData[12].value,
      updated_at: productData[13].value
    }

    // Sync basic form data
    selectedType.value = product.value.type
    productName.value = product.value.product_name
    primaryMedia.value = product.value.medias.primary
    additionalMedia.value = product.value.medias.additional
    selectedUnit.value = product.value.unit
    category.value = product.value.category

    // Sync options from option1, option2, option3
    if (product.value.option1) {
      const [attr1, values1] = Object.entries(product.value.option1)[0]
      selectedAttributes.value['4'] = attr1
      selectedOptions.value['4'] = Array.isArray(values1) ? values1 : [values1]
    }
    if (product.value.option2) {
      const [attr2, values2] = Object.entries(product.value.option2)[0]
      selectedAttributes.value['5'] = attr2
      selectedOptions.value['5'] = Array.isArray(values2) ? values2 : [values2]
    }
    if (product.value.option3) {
      const [attr3, values3] = Object.entries(product.value.option3)[0]
      selectedAttributes.value['6'] = attr3
      selectedOptions.value['6'] = Array.isArray(values3) ? values3 : [values3]
    }

    // Sync SKU details and stock
    product.value.items.forEach(item => {
      // Initialize SKU details
      skuDetailsData.value[item.SKU] = {
        upc: item.upc,
        collection: item.collection,
        cost: item.cost,
        price: item.price,
        mrp: item.MRP
      }

      // Initialize stock details with a single row
      stockDetails.value[item.SKU] = {
        rows: [{
          group: '001',
          stock: item.stock,
          dom: '',
          shelfLife: ''
        }]
      }

      // Initialize SKU media if it exists
      try {
        const mediaData = JSON.parse(item.medias)
        skuMedia.value[item.SKU] = {
          primary: mediaData.primary,
          additional: mediaData.additional || []
        }
      } catch (e) {
        console.error('Failed to parse SKU media:', e)
        skuMedia.value[item.SKU] = {
          primary: null,
          additional: []
        }
      }
    })

  } catch (error) {
    console.error('Failed to fetch product:', error)
    loadError.value = 'Failed to load product. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// Update the saveProduct function
const saveProduct = async () => {
  if (!product.value || isSaving.value) return
  
  try {
    isSaving.value = true

    // Create option objects from selected attributes and options
    const option1 = selectedAttributes.value['4'] && selectedOptions.value['4'].length 
      ? { [selectedAttributes.value['4']]: selectedOptions.value['4'] }
      : null
      
    const option2 = selectedAttributes.value['5'] && selectedOptions.value['5'].length 
      ? { [selectedAttributes.value['5']]: selectedOptions.value['5'] }
      : null
      
    const option3 = selectedAttributes.value['6'] && selectedOptions.value['6'].length 
      ? { [selectedAttributes.value['6']]: selectedOptions.value['6'] }
      : null

    // Map generated SKUs to items with their details
    const items = generatedSkus.value.map(sku => ({
      SKU: sku.sku,
      desc: sku.combination.join(', '),
      upc: skuDetailsData.value[sku.sku]?.upc || '',
      medias: JSON.stringify({
        primary: skuMedia.value[sku.sku]?.primary || null,
        additional: skuMedia.value[sku.sku]?.additional || []
      }),
      collection: skuDetailsData.value[sku.sku]?.collection || '',
      cost: Number(skuDetailsData.value[sku.sku]?.cost || 0),
      price: Number(skuDetailsData.value[sku.sku]?.price || 0),
      MRP: Number(skuDetailsData.value[sku.sku]?.mrp || 0),
      stock: getSkuTotalStock(sku.sku) || 0
    }))

    // Calculate total stock from all SKUs
    const totalstock = items.reduce((sum, item) => sum + item.stock, 0)

    // Update the product value with all changes
    product.value = {
      ...product.value,
      type: selectedType.value,
      product_name: productName.value,
      medias: {
        primary: primaryMedia.value,
        additional: additionalMedia.value
      },
      unit: selectedUnit.value,
      category: category.value,
      option1: option1 ? JSON.stringify(option1) : null,
      option2: option2 ? JSON.stringify(option2) : null,
      option3: option3 ? JSON.stringify(option3) : null,
      totalstock,
      items
    }

    const url = "https://commerce-tarframework.turso.io/v2/pipeline"
    const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Mjk2NzQwNjQsImlkIjoiN2ZiNTFhMTgtYjU1My00Y2M2LTkwZWItZDE0ZTcxNDI5ODlhIn0.zxIjODPlBzNcAgQQ70xZj2sI7j7RSAHpYPQUtvyoAHDb4nLGzHAPiVvnJ6qeK7-00F8A6Lz__CSPjdITPZ31BQ"

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [{
          type: "execute",
          stmt: {
            sql: `UPDATE products SET 
              type = ?,
              product_name = ?,
              description = ?,
              medias = ?,
              unit = ?,
              category = ?,
              option1 = ?,
              option2 = ?,
              option3 = ?,
              totalstock = ?,
              items = ?
              WHERE id = ?`,
            args: [
              { type: 'text', value: product.value.type },
              { type: 'text', value: product.value.product_name },
              { type: 'text', value: product.value.description },
              { type: 'text', value: JSON.stringify(product.value.medias) },
              { type: 'text', value: product.value.unit },
              { type: 'text', value: product.value.category },
              { type: 'text', value: product.value.option1 },
              { type: 'text', value: product.value.option2 },
              { type: 'text', value: product.value.option3 },
              { type: 'integer', value: String(product.value.totalstock) },
              { type: 'text', value: JSON.stringify(product.value.items) },
              { type: 'integer', value: String(product.value.id) }
            ]
          }
        }]
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Navigate back to products page after successful save
    navigateTo('/products')

  } catch (error) {
    console.error('Failed to save product:', error)
  } finally {
    isSaving.value = false
  }
}

// Navigation
const goBack = () => {
  navigateTo('/products')
}

onMounted(() => {
  fetchProduct()
})

// Add computed properties
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
      current.push(`${attribute}:${value}`)
      generateCombinations(current, index + 1)
      current.pop()
    }
  }
  
  generateCombinations([], 0)
  
  return combinations.map(combination => {
    const namePrefix = productName.value.slice(0, 3).toUpperCase()
    const typeIndicator = selectedType.value
    const categoryPrefix = category.value.slice(0, 3).toUpperCase()
    
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

// Add these methods after the existing ones
const toggleType = () => {
  selectedType.value = selectedType.value === 'G' ? 'I' : 'G'
}

const openDescriptionEditor = () => {
  showDescriptionSheet.value = true
}

const triggerPrimaryFileInput = () => {
  primaryFileInput.value?.click()
}

const triggerAdditionalFileInput = () => {
  additionalFileInput.value?.click()
}

const handlePrimaryImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    try {
      const file = input.files[0]
      const mediaType = getMediaType(file)
      const formData = new FormData()
      
      const ext = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      
      formData.append('name', filename)
      formData.append('file', file)

      const response = await fetch('https://par.wetarteam.workers.dev/upload', {
        method: 'PUT',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      primaryMedia.value = {
        url: `${R2_BASE_URL}/${filename}`,
        mediaType
      }

    } catch (error) {
      console.error('Failed to upload media:', error)
    }
  }
}

const handleAdditionalImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    try {
      const file = input.files[0]
      const mediaType = getMediaType(file)
      const formData = new FormData()
      
      const ext = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      
      formData.append('name', filename)
      formData.append('file', file)

      const response = await fetch('https://par.wetarteam.workers.dev/upload', {
        method: 'PUT',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      additionalMedia.value.push({
        url: `${R2_BASE_URL}/${filename}`,
        mediaType
      })

    } catch (error) {
      console.error('Failed to upload media:', error)
    }
  }
}

const getMediaType = (file: File): 'image' | 'video' => {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

const openMediaPreview = (media: MediaItem, type: 'primary' | 'additional', index?: number) => {
  selectedMediaPreview.value = {
    url: media.url,
    mediaType: media.mediaType,
    type,
    index
  }
  showMediaPreviewSheet.value = true
}

const handleAttributeChange = (rowNum: string, newValue: string) => {
  if (selectedAttributes.value[rowNum] !== newValue && selectedOptions.value[rowNum].length > 0) {
    pendingAttributeChange.value = { rowNum, newValue }
    showConfirmationSheet.value = true
  } else {
    applyAttributeChange(rowNum, newValue)
  }
}

const applyAttributeChange = (rowNum: string, newValue: string) => {
  selectedAttributes.value[rowNum] = newValue
  selectedOptions.value[rowNum] = []
}

const getAvailableAttributes = (currentRowNum: string) => {
  const selectedValues = Object.entries(selectedAttributes.value)
    .filter(([rowNum]) => rowNum !== currentRowNum)
    .map(([_, value]) => value)

  return attributes.value.filter(attr => 
    !selectedValues.includes(attr.value)
  )
}

const getFilteredOptions = (rowNum: string) => {
  const attribute = selectedAttributes.value[rowNum]
  if (!attribute) return []
  
  return optionValues.value.filter(option => 
    option.attribute === attribute
  )
}

const selectedOptionsString = (rowNum: string): string => {
  return selectedOptions.value[rowNum][0] || ''
}

const handleMultiSelectUpdate = (rowNum: string, value: string) => {
  const currentValues = selectedOptions.value[rowNum]
  const index = currentValues.indexOf(value)
  
  if (index === -1) {
    selectedOptions.value[rowNum] = [...currentValues, value]
  } else {
    selectedOptions.value[rowNum] = currentValues.filter(v => v !== value)
  }
}

const openSkuDetailsSheet = (sku: GeneratedSku) => {
  selectedSkuDetails.value = sku
  showSkuDetailsSheet.value = true
}

const openStockManagementSheet = (sku: GeneratedSku) => {
  selectedSkuForStock.value = sku
  showStockManagementSheet.value = true
}

const getSkuTotalStock = (sku: string) => {
  return stockDetails.value[sku]?.rows.reduce((total, row) => total + (row.stock || 0), 0) || 0
}

// Add this to initialize IndexedDB data on mount
onMounted(async () => {
  try {
    await initDB()
    while (dbStatus.value === 'loading') {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (dbStatus.value === 'error') {
      throw new Error('Database failed to initialize')
    }

    const [savedAttributes, savedOptions] = await Promise.all([
      getAttributes(),
      getOptions()
    ])
    
    attributes.value = savedAttributes.map(attr => ({
      value: attr.value,
      label: attr.value,
      type: attr.type || 'text'
    }))

    optionValues.value = savedOptions

    await fetchProduct()
  } catch (error) {
    console.error('Failed to initialize:', error)
    loadError.value = 'Failed to load data. Please try again.'
  }
})

// Add this ref for tracking pending changes
const pendingAttributeChange = ref<{
  rowNum: string;
  newValue: string;
} | null>(null)
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Header -->
    <header class="sticky top-0 flex h-16 items-center justify-between border-b bg-white px-2 md:px-6 z-10">
      <div class="flex items-center">
        <Button variant="ghost" size="icon" class="mr-2" @click="goBack">
          <ArrowLeft class="h-5 w-5" />
          <span class="sr-only">Go back</span>
        </Button>
        <h1 class="text-sm font-semibold">Edit Product</h1>
      </div>
      <div>
        <Button 
          variant="ghost" 
          @click="saveProduct"
          class="px-4"
          :disabled="isSaving"
        >
          {{ isSaving ? 'Saving...' : 'Save' }}
        </Button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="isLoading" class="flex items-center justify-center p-4">
        <div class="text-sm text-gray-500">Loading...</div>
      </div>

      <div v-else-if="loadError" class="flex items-center justify-center p-4">
        <div class="text-sm text-red-500">{{ loadError }}</div>
      </div>

      <div v-else-if="product" class="p-8 space-y-4">
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
                :class="{ 'border-dashed border-gray-300': !primaryMedia }"
              >
                <template v-if="primaryMedia">
                  <img 
                    v-if="primaryMedia.mediaType === 'image'"
                    :src="primaryMedia.url" 
                    class="w-full h-full object-cover cursor-pointer"
                    alt="Primary media"
                    @click.stop="openMediaPreview(primaryMedia, 'primary')"
                  />
                  <div 
                    v-else 
                    class="w-full h-full flex items-center justify-center cursor-pointer"
                    @click.stop="openMediaPreview(primaryMedia, 'primary')"
                  >
                    <VideoIcon class="w-6 h-6 text-gray-400" />
                  </div>
                </template>
                <ImageIcon v-else class="w-4 h-4 text-gray-400" />
              </button>
              <input
                ref="primaryFileInput"
                type="file"
                :accept="acceptedFileTypes"
                class="hidden"
                @change="handlePrimaryImageUpload"
              />
            </div>
            
            <!-- Additional Images Cell -->
            <div class="flex-1 p-2">
              <div class="flex items-center gap-2 overflow-x-auto">
                <!-- Uploaded Media -->
                <div 
                  v-for="(media, index) in additionalMedia" 
                  :key="index"
                  class="flex-shrink-0 w-12 h-12 rounded border overflow-hidden cursor-pointer"
                  @click="openMediaPreview(media, 'additional', index)"
                >
                  <img 
                    v-if="media.mediaType === 'image'"
                    :src="media.url" 
                    class="w-full h-full object-cover"
                    alt="Additional media"
                  />
                  <div 
                    v-else 
                    class="w-full h-full flex items-center justify-center"
                  >
                    <VideoIcon class="w-6 h-6 text-gray-400" />
                  </div>
                </div>
                
                <!-- Add Media Button -->
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
                :accept="acceptedFileTypes"
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

        <!-- SKU Table -->
        <div class="border-t">
          <div>
            <template v-if="generatedSkus.length">
              <div 
                v-for="(item, index) in generatedSkus" 
                :key="index"
                class="border-t first:border-t-0"
              >
                <div class="grid grid-cols-[1fr,100px]">
                  <!-- Cell 1 - SKU Details (Clickable) -->
                  <div 
                    class="p-3 hover:bg-gray-50/50 cursor-pointer"
                    @click="openSkuDetailsSheet(item)"
                  >
                    <div class="text-sm font-medium">
                      {{ item.sku }}
                    </div>
                    <div class="mt-1 text-xs text-gray-500">
                      {{ category }} {{ item.combination.map(pair => pair.split(': ')[1]).join(' ') }}
      </div>
    </div>

                  <!-- Cell 2 - Stock Input -->
                  <div 
                    class="flex items-center border-l p-3 cursor-pointer hover:bg-gray-50/50"
                    @click="openStockManagementSheet(item)"
                  >
                    <span class="text-sm">{{ getSkuTotalStock(item.sku) }}</span>
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
  </div>
</template>

<style scoped>
/* Copy all styles from add-product.vue */
</style> 