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

// At the top of the script section, after imports and interfaces
// Add all refs and state variables
const route = useRoute()
const productId = route.params.id
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const isSaving = ref(false)

// Navigation function - keep only this one, remove all other declarations
const goBack = () => {
  navigateTo('/products')
}

// Form data refs
const selectedType = ref('I')
const productName = ref('')
const category = ref('')
const selectedUnit = ref('pcs')
const primaryMedia = ref<MediaItem | null>(null)
const additionalMedia = ref<MediaItem[]>([])
const product = ref<Product | null>(null)

// Sheet refs
const primaryFileInput = ref<HTMLInputElement | null>(null)
const additionalFileInput = ref<HTMLInputElement | null>(null)
const showConfirmationSheet = ref(false)
const showDescriptionSheet = ref(false)
const showSkuSheet = ref(false)
const showSkuDetailsSheet = ref(false)
const showDatePickerSheet = ref(false)
const showStockManagementSheet = ref(false)
const showMediaPreviewSheet = ref(false)

// Editor refs
const editor = ref<EditorJS | null>(null)
const editorData = ref<EditorData>({
  time: Date.now(),
  blocks: [],
  version: '2.28.2'
})

// SKU and stock refs
const selectedSku = ref<GeneratedSku | null>(null)
const selectedSkuDetails = ref<GeneratedSku | null>(null)
const selectedSkuForStock = ref<GeneratedSku | null>(null)
const selectedDate = ref('')
const selectedRowIndex = ref<number | null>(null)
const selectedMediaPreview = ref<MediaPreview | null>(null)

// Attribute and option refs
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
  '6': ''
})

// Pending changes ref
const pendingAttributeChange = ref<{
  rowNum: string;
  newValue: string;
} | null>(null)

// Storage refs
const stockDetails = ref<{ [key: string]: StockDetails }>({})
const skuDetailsData = ref<{ [key: string]: SkuDetails }>({})
const skuMedia = ref<{ [key: string]: { primary: MediaItem | null; additional: MediaItem[] } }>({})

// Constants
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

// Helper functions
const handleMultiSelectUpdate = (rowNum: string, value: string) => {
  const currentValues = selectedOptions.value[rowNum]
  const index = currentValues.indexOf(value)
  
  if (index === -1) {
    selectedOptions.value[rowNum] = [...currentValues, value]
  } else {
    selectedOptions.value[rowNum] = currentValues.filter(v => v !== value)
  }
}

const selectedOptionsString = (rowNum: string): string => {
  return selectedOptions.value[rowNum][0] || ''
}

const getSkuMedia = (sku: string | undefined) => {
  if (!sku) return { primary: null, additional: [] }
  return skuMedia.value[sku] || { primary: null, additional: [] }
}

// Remove all other duplicate declarations of these functions

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

// Add these methods for SKU details management

// Method to update SKU fields
const updateSkuField = (field: keyof SkuDetails, value: string | number) => {
  if (selectedSkuDetails.value) {
    const sku = selectedSkuDetails.value.sku
    if (!skuDetailsData.value[sku]) {
      skuDetailsData.value[sku] = {
        upc: '',
        collection: '',
        cost: 0,
        price: 0,
        mrp: 0
      }
    }
    skuDetailsData.value[sku] = {
      ...skuDetailsData.value[sku],
      [field]: value
    }
  }
}

// Methods for SKU media handling
const skuPrimaryFileInput = ref<HTMLInputElement | null>(null)
const skuAdditionalFileInput = ref<HTMLInputElement | null>(null)

const handleSkuPrimaryUpload = async (event: Event) => {
  if (!selectedSkuDetails.value) return
  
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
      
      // Initialize SKU media if not exists
      if (!skuMedia.value[selectedSkuDetails.value.sku]) {
        skuMedia.value[selectedSkuDetails.value.sku] = {
          primary: null,
          additional: []
        }
      }
      
      skuMedia.value[selectedSkuDetails.value.sku].primary = {
        url: `${R2_BASE_URL}/${filename}`,
        mediaType
      }

    } catch (error) {
      console.error('Failed to upload media:', error)
    }
  }
}

const handleSkuAdditionalUpload = async (event: Event) => {
  if (!selectedSkuDetails.value) return
  
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
      
      // Initialize SKU media if not exists
      if (!skuMedia.value[selectedSkuDetails.value.sku]) {
        skuMedia.value[selectedSkuDetails.value.sku] = {
          primary: null,
          additional: []
        }
      }
      
      skuMedia.value[selectedSkuDetails.value.sku].additional.push({
        url: `${R2_BASE_URL}/${filename}`,
        mediaType
      })

    } catch (error) {
      console.error('Failed to upload media:', error)
    }
  }
}

const triggerSkuPrimaryFileInput = () => {
  skuPrimaryFileInput.value?.click()
}

const triggerSkuAdditionalFileInput = () => {
  skuAdditionalFileInput.value?.click()
}

// Method to handle SKU media preview
const openSkuMediaPreview = (media: MediaItem, type: 'primary' | 'additional', index?: number) => {
  selectedMediaPreview.value = {
    url: media.url,
    mediaType: media.mediaType,
    type,
    index
  }
  showMediaPreviewSheet.value = true
}

// Method to remove media
const removeSkuMedia = async () => {
  if (!selectedMediaPreview.value || !selectedSkuDetails.value) return

  try {
    const filename = selectedMediaPreview.value.url.split('/').pop()
    if (!filename) throw new Error('Invalid file URL')

    const response = await fetch(`https://par.wetarteam.workers.dev/${filename}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete file')
    }

    const sku = selectedSkuDetails.value.sku
    if (selectedMediaPreview.value.type === 'primary') {
      skuMedia.value[sku].primary = null
    } else if (selectedMediaPreview.value.index !== undefined) {
      skuMedia.value[sku].additional.splice(selectedMediaPreview.value.index, 1)
    }

    showMediaPreviewSheet.value = false
    selectedMediaPreview.value = null

  } catch (error) {
    console.error('Failed to remove media:', error)
  }
}

// Method to initialize SKU details
const initSkuDetails = (sku: string) => {
  if (!skuDetailsData.value[sku]) {
    skuDetailsData.value[sku] = {
      upc: '',
      collection: '',
      cost: 0,
      price: 0,
      mrp: 0
    }
  }
  
  if (!skuMedia.value[sku]) {
    skuMedia.value[sku] = {
      primary: null,
      additional: []
    }
  }
}

// Method to open SKU details sheet
const openSkuDetails = (sku: GeneratedSku) => {
  selectedSkuDetails.value = sku
  initSkuDetails(sku.sku)
  showSkuDetailsSheet.value = true
}

// Add stock management methods
const addStockRow = (sku: string) => {
  if (!stockDetails.value[sku]) {
    stockDetails.value[sku] = {
      rows: []
    }
  }
  
  const nextGroup = (stockDetails.value[sku].rows.length + 1).toString().padStart(3, '0')
  stockDetails.value[sku].rows.push({
    group: nextGroup,
    stock: 0,
    dom: '',
    shelfLife: ''
  })
}

const showDatePicker = (rowIndex: number) => {
  selectedRowIndex.value = rowIndex
  showDatePickerSheet.value = true
}

const handleDateSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  selectedDate.value = input.value
}

const confirmDateSelection = () => {
  if (selectedRowIndex.value !== null && selectedSkuForStock.value) {
    const sku = selectedSkuForStock.value.sku
    stockDetails.value[sku].rows[selectedRowIndex.value].dom = selectedDate.value
  }
  showDatePickerSheet.value = false
  selectedRowIndex.value = null
}

const confirmAttributeChange = () => {
  if (pendingAttributeChange.value) {
    const { rowNum, newValue } = pendingAttributeChange.value
    applyAttributeChange(rowNum, newValue)
  }
  showConfirmationSheet.value = false
  pendingAttributeChange.value = null
}

// Add these interfaces at the top of the script section
interface MediaItem {
  url: string
  mediaType: 'image' | 'video'
}

interface Product {
  id: number
  storeid: string
  type: string
  prodtype: 'physical' | 'digital' | 'service'
  productname: string
  description: string
  medias: {
    primary: MediaItem | null
    additional: MediaItem[]
  }
  handle: string
  pagetitle: string
  metadesc: string
  unit: string
  category: string
  vendor: string
  collections: string[]
  tags: string[]
  option1: any
  option2: any
  option3: any
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
  trackquantity: boolean
  continueselling: boolean
  status: 'draft' | 'published'
  publishedat: string | null
  saleschannels: string[]
  visibility: 'visible' | 'hidden'
  weight: number | null
  weightunit: string
  createdat: string
  updatedat: string
  active: boolean
}

interface EditorData {
  time: number
  blocks: any[]
  version: string
}

interface GeneratedSku {
  sku: string
  combination: string[]
  stock: number
}

interface StockRow {
  group: string
  stock: number
  dom: string
  shelfLife: string
}

interface StockDetails {
  rows: StockRow[]
}

interface SkuDetails {
  upc: string
  collection: string
  cost: number
  price: number
  mrp: number
}

interface MediaPreview {
  url: string
  mediaType: 'image' | 'video'
  type: 'primary' | 'additional'
  index?: number
}

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

// Add the fetchProduct function
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

    // Update the safeJsonParse function
    const safeJsonParse = (value: string | null, defaultValue: any = null) => {
      if (!value) return defaultValue
      if (typeof value !== 'string') return value

      try {
        // First try direct parsing
        return JSON.parse(value)
      } catch (e) {
        try {
          // Try cleaning the string first
          let cleaned = value
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            .replace(/\f/g, '\\f')
            .replace(/[\u0000-\u0019]+/g, '')
            .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
            .replace(/:\s*'([^']*)'/g, ':"$1"')
            
          // Special handling for escaped JSON strings
          if (cleaned.includes('\\"')) {
            cleaned = cleaned.replace(/\\"/g, '"')
            cleaned = cleaned.replace(/""{/g, '"{')
            cleaned = cleaned.replace(/}""/, '}"')
          }
            
          return JSON.parse(cleaned)
        } catch (e2) {
          // If still fails, try one more time with the original value
          try {
            // Handle case where the string is already valid JSON but double-escaped
            const unescaped = value.replace(/\\/g, '')
            return JSON.parse(unescaped)
          } catch (e3) {
            console.error('JSON parse error after cleaning:', e3, 'Original value:', value)
            return defaultValue
          }
        }
      }
    }

    // Update the parseItems function
    const parseItems = (itemsValue: string | null) => {
      if (!itemsValue) return []
      
      try {
        // If already an array, return as is
        if (Array.isArray(itemsValue)) return itemsValue

        // If it's a string, try to parse it directly first
        if (typeof itemsValue === 'string') {
          try {
            const parsed = JSON.parse(itemsValue)
            if (Array.isArray(parsed)) {
              return parsed.map(item => ({
                SKU: item.SKU || '',
                desc: item.desc || '',
                upc: item.upc || '',
                medias: item.medias || '{"primary":null,"additional":[]}',
                collection: item.collection || '',
                cost: Number(item.cost || 0),
                price: Number(item.price || 0),
                MRP: Number(item.MRP || 0),
                stock: Number(item.stock || 0)
              }))
            }
          } catch (e) {
            // If direct parsing fails, try cleaning the string
            const cleaned = itemsValue
              .replace(/\\"/g, '"') // Replace escaped quotes
              .replace(/"{/g, '{')  // Remove quotes around objects
              .replace(/}"/g, '}')  // Remove quotes around objects
              .replace(/\\/g, '')   // Remove remaining backslashes

            const parsed = JSON.parse(cleaned)
            if (Array.isArray(parsed)) {
              return parsed.map(item => ({
                SKU: item.SKU || '',
                desc: item.desc || '',
                upc: item.upc || '',
                medias: item.medias || '{"primary":null,"additional":[]}',
                collection: item.collection || '',
                cost: Number(item.cost || 0),
                price: Number(item.price || 0),
                MRP: Number(item.MRP || 0),
                stock: Number(item.stock || 0)
              }))
            }
          }
        }

        console.error('Items value is not an array:', itemsValue)
        return []
      } catch (e) {
        console.error('Error parsing items:', e, 'Original value:', itemsValue)
        return []
      }
    }

    // Map the row data to product object
    product.value = {
      id: Number(productData[0].value),
      storeid: productData[1].value,
      type: productData[2].value,
      prodtype: productData[3].value,
      productname: productData[4].value,
      description: productData[5].value,
      medias: safeJsonParse(productData[6].value, { primary: null, additional: [] }),
      handle: productData[7].value,
      pagetitle: productData[8].value,
      metadesc: productData[9].value,
      unit: productData[10].value,
      category: productData[11].value,
      vendor: productData[12].value,
      collections: safeJsonParse(productData[13].value, []),
      tags: safeJsonParse(productData[14].value, []),
      option1: safeJsonParse(productData[15].value),
      option2: safeJsonParse(productData[16].value),
      option3: safeJsonParse(productData[17].value),
      items: parseItems(productData[18].value),
      totalstock: Number(productData[19].value),
      trackquantity: Boolean(productData[20].value),
      continueselling: Boolean(productData[21].value),
      status: productData[22].value,
      publishedat: productData[23].value,
      saleschannels: safeJsonParse(productData[24].value, []),
      visibility: productData[25].value,
      weight: productData[26].value ? Number(productData[26].value) : null,
      weightunit: productData[27].value,
      createdat: productData[28].value,
      updatedat: productData[29].value,
      active: Boolean(productData[30].value)
    }

    // Sync basic form data
    selectedType.value = product.value.type
    productName.value = product.value.productname
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
        const mediaData = safeJsonParse(item.medias)
        skuMedia.value[item.SKU] = {
          primary: mediaData?.primary || null,
          additional: mediaData?.additional || []
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

// Add the saveProduct function
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

    // Update the product value with all changes
    product.value = {
      ...product.value,
      type: selectedType.value,
      productname: productName.value,
      medias: {
        primary: primaryMedia.value,
        additional: additionalMedia.value
      },
      unit: selectedUnit.value,
      category: category.value,
      option1: option1 ? JSON.stringify(option1) : null,
      option2: option2 ? JSON.stringify(option2) : null,
      option3: option3 ? JSON.stringify(option3) : null,
      items: product.value.items.map(item => ({
        ...item,
        medias: JSON.stringify({
          primary: skuMedia.value[item.SKU]?.primary || null,
          additional: skuMedia.value[item.SKU]?.additional || []
        }),
        upc: skuDetailsData.value[item.SKU]?.upc || '',
        collection: skuDetailsData.value[item.SKU]?.collection || '',
        cost: Number(skuDetailsData.value[item.SKU]?.cost || 0),
        price: Number(skuDetailsData.value[item.SKU]?.price || 0),
        MRP: Number(skuDetailsData.value[item.SKU]?.mrp || 0),
        stock: getSkuTotalStock(item.SKU) || 0
      }))
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
              productname = ?,
              description = ?,
              medias = ?,
              unit = ?,
              category = ?,
              option1 = ?,
              option2 = ?,
              option3 = ?,
              items = ?
              WHERE id = ?`,
            args: [
              { type: 'text', value: product.value.type },
              { type: 'text', value: product.value.productname },
              { type: 'text', value: product.value.description },
              { type: 'text', value: JSON.stringify(product.value.medias) },
              { type: 'text', value: product.value.unit },
              { type: 'text', value: product.value.category },
              { type: 'text', value: product.value.option1 },
              { type: 'text', value: product.value.option2 },
              { type: 'text', value: product.value.option3 },
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

// Add this computed property after other refs
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
                    @click="openSkuDetails(item)"
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

  <!-- SKU Details Sheet -->
  <Sheet v-model:open="showSkuDetailsSheet">
    <SheetContent 
      side="bottom" 
      class="h-[100dvh] w-full !translate-y-0 !transition-none"
    >
      <SheetHeader>
        <SheetTitle>SKU Details</SheetTitle>
        <SheetDescription>
          {{ selectedSkuDetails?.sku }} - {{ category }} {{ selectedSkuDetails?.combination.map(pair => pair.split(': ')[1]).join(' ') }}
        </SheetDescription>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <div class="rounded-lg border bg-white overflow-hidden">
          <!-- UPC Row -->
          <div class="flex items-center border-b">
            <div class="w-24 p-3 border-r bg-gray-50">
              <span class="text-sm font-medium">UPC</span>
            </div>
            <div class="flex-1 p-2">
              <Input
                :model-value="skuDetailsData[selectedSkuDetails?.sku || '']?.upc"
                @update:model-value="value => updateSkuField('upc', value)"
                type="text"
                placeholder="Enter UPC"
                class="w-full border-0 shadow-none focus:ring-0"
              />
            </div>
          </div>

          <!-- Collection Row -->
          <div class="flex items-center border-b">
            <div class="w-24 p-3 border-r bg-gray-50">
              <span class="text-sm font-medium">Collection</span>
            </div>
            <div class="flex-1 p-2">
              <Input
                :model-value="skuDetailsData[selectedSkuDetails?.sku || '']?.collection"
                @update:model-value="value => updateSkuField('collection', value)"
                type="text"
                placeholder="Enter collection"
                class="w-full border-0 shadow-none focus:ring-0"
              />
            </div>
          </div>

          <!-- Cost Row -->
          <div class="flex items-center border-b">
            <div class="w-24 p-3 border-r bg-gray-50">
              <span class="text-sm font-medium">Cost</span>
            </div>
            <div class="flex-1 p-2">
              <Input
                :model-value="skuDetailsData[selectedSkuDetails?.sku || '']?.cost"
                @update:model-value="value => updateSkuField('cost', Number(value))"
                type="number"
                placeholder="0.00"
                class="w-full border-0 shadow-none focus:ring-0"
              />
            </div>
          </div>

          <!-- Price Row -->
          <div class="flex items-center border-b">
            <div class="w-24 p-3 border-r bg-gray-50">
              <span class="text-sm font-medium">Price</span>
            </div>
            <div class="flex-1 p-2">
              <Input
                :model-value="skuDetailsData[selectedSkuDetails?.sku || '']?.price"
                @update:model-value="value => updateSkuField('price', Number(value))"
                type="number"
                placeholder="0.00"
                class="w-full border-0 shadow-none focus:ring-0"
              />
            </div>
          </div>

          <!-- MRP Row -->
          <div class="flex items-center">
            <div class="w-24 p-3 border-r bg-gray-50">
              <span class="text-sm font-medium">MRP</span>
            </div>
            <div class="flex-1 p-2">
              <Input
                :model-value="skuDetailsData[selectedSkuDetails?.sku || '']?.mrp"
                @update:model-value="value => updateSkuField('mrp', Number(value))"
                type="number"
                placeholder="0.00"
                class="w-full border-0 shadow-none focus:ring-0"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 bg-white border-t">
        <Button class="w-full" @click="showSkuDetailsSheet = false">
          Save Changes
        </Button>
      </div>
    </SheetContent>
  </Sheet>

  <!-- Stock Management Sheet -->
  <Sheet v-model:open="showStockManagementSheet">
    <SheetContent 
      side="bottom" 
      class="h-[100dvh] w-full !translate-y-0 !transition-none"
    >
      <SheetHeader>
        <SheetTitle>Stock Management</SheetTitle>
        <SheetDescription>
          {{ selectedSkuForStock?.sku }} - {{ category }} {{ selectedSkuForStock?.combination.map(pair => pair.split(': ')[1]).join(' ') }}
        </SheetDescription>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto p-4">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-900">Stock Management</h3>
            <Button 
              variant="ghost" 
              size="icon"
              class="h-8 w-8 p-0"
              @click="addStockRow(selectedSkuForStock?.sku || '')"
            >
              <Plus class="h-4 w-4" />
            </Button>
          </div>
          
          <div class="rounded-lg border bg-white overflow-hidden">
            <!-- Header Row -->
            <div class="grid grid-cols-4 text-sm border-b bg-gray-50">
              <div class="p-3 font-medium border-r text-center">Group</div>
              <div class="p-3 font-medium border-r text-center">Stock</div>
              <div class="p-3 font-medium border-r text-center">DOM</div>
              <div class="p-3 font-medium text-center">Shelf Life</div>
            </div>

            <!-- Data Rows -->
            <div 
              v-for="(row, index) in stockDetails[selectedSkuForStock?.sku || '']?.rows" 
              :key="index"
              class="grid grid-cols-4 border-b last:border-b-0"
            >
              <div class="p-3 border-r">
                <span class="block text-sm text-center">{{ row.group }}</span>
              </div>
              <div class="p-3 border-r">
                <Input
                  v-model.number="row.stock"
                  type="number"
                  class="w-full border-0 shadow-none focus:ring-0 p-0 text-center"
                />
              </div>
              <div class="p-3 border-r">
                <Input
                  v-model="row.dom"
                  type="date"
                  class="w-full border-0 shadow-none focus:ring-0 p-0 text-center [&::-webkit-calendar-picker-indicator]:hidden"
                  @click="showDatePicker(index)"
                />
              </div>
              <div class="p-3">
                <Input
                  v-model="row.shelfLife"
                  type="text"
                  class="w-full border-0 shadow-none focus:ring-0 p-0 text-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4 bg-white border-t">
        <Button class="w-full" @click="showStockManagementSheet = false">
          Save Changes
        </Button>
      </div>
    </SheetContent>
  </Sheet>

  <!-- Date Picker Sheet -->
  <Sheet v-model:open="showDatePickerSheet">
    <SheetContent side="bottom" class="h-[400px]">
      <SheetHeader>
        <SheetTitle>Select Date</SheetTitle>
        <SheetDescription>
          Choose a date for the selected stock entry
        </SheetDescription>
      </SheetHeader>

      <div class="p-4">
        <input 
          type="date" 
          class="w-full p-4 text-lg rounded-lg border"
          v-model="selectedDate"
          @change="handleDateSelect"
        />
      </div>
      <div class="p-4 bg-white border-t">
        <Button class="w-full" @click="confirmDateSelection">
          Confirm
        </Button>
      </div>
    </SheetContent>
  </Sheet>

  <!-- Confirmation Sheet -->
  <Sheet v-model:open="showConfirmationSheet">
    <SheetContent side="bottom" class="h-[50vh] rounded-t-xl">
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
          <Button variant="outline" @click="showConfirmationSheet = false">
            Cancel
          </Button>
          <Button @click="confirmAttributeChange">
            Confirm Change
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.overflow-auto::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.overflow-auto {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
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

/* Add these styles */
:deep(input) {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

:deep(input:focus) {
  outline: none !important;
  ring: none !important;
  border: none !important;
  box-shadow: none !important;
}

/* Update existing hover style */
.hover\:bg-gray-50:hover :deep(input) {
  background-color: transparent !important;
}

/* Add to your existing styles */
:deep(.codex-editor) {
  padding: 0;
}

:deep(.ce-toolbar__content) {
  max-width: none;
  margin: 0;
}

:deep(.ce-block__content) {
  max-width: none;
  margin: 0;
}

:deep(.codex-editor__redactor) {
  padding-bottom: 80px !important;
}

:deep(.ce-toolbar__plus) {
  left: -30px;
}

:deep(.ce-toolbar__actions) {
  right: -30px;
}

/* Add or update these styles */
:deep(.codex-editor) {
  padding: 1rem 0 !important;
  border: none !important;
}

:deep(.ce-toolbar__content) {
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

:deep(.ce-block__content) {
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

:deep(.codex-editor__redactor) {
  padding-bottom: 80px !important;
  margin: 0 !important;
}

:deep(.ce-toolbar__plus) {
  left: -30px !important;
}

:deep(.ce-toolbar__actions) {
  right: -30px !important;
}

:deep(.ce-block) {
  margin: 0 !important;
  padding: 0.5rem 0 !important;
}

:deep(.ce-paragraph) {
  padding: 0 !important;
  line-height: 1.6 !important;
}

:deep(.ce-toolbar__settings-btn) {
  width: 24px !important;
  height: 24px !important;
}

:deep(.ce-inline-toolbar) {
  border-radius: 6px !important;
}

:deep(.ce-conversion-toolbar) {
  border-radius: 6px !important;
}

/* Add this to your existing styles */
:deep(input) {
  &:focus-visible {
    outline: none !important;
  }
}

:deep(.input:focus) {
  outline: none !important;
  box-shadow: none !important;
}

:deep(.input:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
}

/* Add these styles to remove animations */
:deep(.sheet-content[data-state='open']) {
  animation: none !important;
  transform: translateY(0) !important;
}

:deep(.sheet-content[data-state='closed']) {
  animation: none !important;
}

:deep(.sheet-overlay[data-state='open']) {
  animation: none !important;
  opacity: 0.4 !important;
}

:deep(.sheet-overlay[data-state='closed']) {
  animation: none !important;
}

/* Replace the previous animation override styles with these */
:deep(.sheet-content) {
  transition: none !important;
  animation: none !important;
  transform: translateY(0) !important;
}

:deep(.sheet-overlay) {
  transition: none !important;
  animation: none !important;
}

/* Disable all transitions on the sheet */
:deep([data-state]) {
  transition: none !important;
}

/* Force immediate positioning */
:deep(.fixed) {
  transition: none !important;
  transform: translateY(0) !important;
}

/* Override any transform animations */
:deep(*) {
  transform: none !important;
  transition: none !important;
}

/* Add these styles to remove highlights and borders */
:deep(input),
:deep(input:focus),
:deep(input:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
  -webkit-tap-highlight-color: transparent;
}

:deep(.input),
:deep(.input:focus),
:deep(.input:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
  -webkit-tap-highlight-color: transparent;
}

/* Remove tap highlight color on mobile */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Remove border highlight on cells */
.border-r {
  border-color: rgb(229 231 235) !important;
}

/* Remove input field background highlight */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px white inset !important;
}

/* Adjust sheet content styles */
:deep(.sheet-content) {
  * {
    -webkit-tap-highlight-color: transparent;
  }

  input,
  .input {
    background-color: transparent !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    caret-color: transparent !important;
    user-select: none !important;
  }

  input:focus,
  .input:focus {
    outline: none !important;
    box-shadow: none !important;
    background-color: transparent !important;
  }
}

/* Prevent text selection */
.sheet-content {
  user-select: none !important;
}

/* Remove focus ring from all elements in sheet */
:deep(*:focus) {
  outline: none !important;
  box-shadow: none !important;
}

/* Disable all focus styles */
:deep(*) {
  &:focus,
  &:focus-visible,
  &:focus-within {
    outline: none !important;
    box-shadow: none !important;
  }
}
</style> 