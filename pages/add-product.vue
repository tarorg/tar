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
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Paragraph from '@editorjs/paragraph'
import ImageTool from '@editorjs/image'
import Table from '@editorjs/table'

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

// Add new interface for stock details
interface StockDetails {
  rows: StockRow[]
}

// Add this interface for a single stock row
interface StockRow {
  group: string
  stock: number
  dom: string
  shelfLife: string
}

// Add these interfaces near the top
interface UploadResponse {
  success: boolean
  url: string
  message?: string
}

// Add this interface for media type
interface MediaItem {
  url: string
  mediaType: 'image' | 'video'
}

// Update the MediaItem interface to include mediaType
interface MediaItem {
  url: string
  mediaType: 'image' | 'video'
}

// Update the selectedMediaPreview interface
interface MediaPreview {
  url: string
  mediaType: 'image' | 'video'
  type: 'primary' | 'additional'
  index?: number
}

// Add this interface for SKU details
interface SkuDetails {
  upc: string
  collection: string
  cost: number
  price: number
  mrp: number
}

// Add these interfaces near the top
interface EditorBlock {
  data: {
    text?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

interface EditorData {
  blocks: EditorBlock[];
  [key: string]: any;
}

const goBack = () => {
  navigateTo('/products')
}

// Add this ref
const isSaving = ref(false)

// Update the saveProduct function
const saveProduct = async () => {
  if (isSaving.value) return
  
  isSaving.value = true
  try {
    const url = "https://commerce-tarframework.turso.io/v2/pipeline"
    const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Mjk2NzQwNjQsImlkIjoiN2ZiNTFhMTgtYjU1My00Y2M2LTkwZWItZDE0ZTcxNDI5ODlhIn0.zxIjODPlBzNcAgQQ70xZj2sI7j7RSAHpYPQUtvyoAHDb4nLGzHAPiVvnJ6qeK7-00F8A6Lz__CSPjdITPZ31BQ"

    // Format options as JSON objects
    const option1 = selectedAttributes.value['4'] && selectedOptions.value['4'].length 
      ? JSON.stringify({ [selectedAttributes.value['4']]: selectedOptions.value['4'] })
      : ''
      
    const option2 = selectedAttributes.value['5'] && selectedOptions.value['5'].length 
      ? JSON.stringify({ [selectedAttributes.value['5']]: selectedOptions.value['5'] })
      : ''
      
    const option3 = selectedAttributes.value['6'] && selectedOptions.value['6'].length 
      ? JSON.stringify({ [selectedAttributes.value['6']]: selectedOptions.value['6'] })
      : ''

    console.log('Options formatted as:', {
      option1: option1 ? JSON.parse(option1) : null,
      option2: option2 ? JSON.parse(option2) : null,
      option3: option3 ? JSON.parse(option3) : null
    })

    // Prepare the SQL statement
    const sql = `
      INSERT INTO products (
        type,
        product_name,
        description,
        medias,
        unit,
        category,
        option1,
        option2,
        option3,
        totalstock,
        items
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `.trim()

    // Prepare the values
    const values = [
      selectedType.value || '',
      productName.value || '',
      editorData.value?.blocks?.map(block => block?.data?.text || '').join('\n') || '',
      JSON.stringify({
        primary: primaryMedia.value,
        additional: additionalMedia.value
      }),
      selectedUnit.value || '',
      category.value || '',
      option1,  // Now formatted as {"color": ["Red", "Blue"]}
      option2,  // Now formatted as {"material": ["Cotton"]}
      option3,  // Now formatted as {"size": ["Medium"]}
      generatedSkus.value.reduce((sum, sku) => sum + (getSkuTotalStock(sku.sku) || 0), 0),
      JSON.stringify(generatedSkus.value.map(sku => ({
        SKU: sku.sku,
        desc: '',
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
      })))
    ]

    console.log('Saving product with options:', {
      option1,
      option2,
      option3
    })

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            type: "execute",
            stmt: {
              sql,
              args: values.map(value => ({
                type: typeof value === 'number' ? 'integer' : 'text',
                value: String(value)
              }))
            }
          }
        ]
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Server response:', errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    
    if (result.error) {
      throw new Error(result.error)
    }

    // Navigate back to products page after successful save
    navigateTo('/products')

  } catch (error) {
    console.error('Failed to save product:', error)
  } finally {
    isSaving.value = false
  }
}

const selectedType = ref('I')
const productName = ref('')
const primaryImage = ref<string>('')
const additionalImages = ref<string[]>([])
const primaryFileInput = ref<HTMLInputElement | null>(null)
const additionalFileInput = ref<HTMLInputElement | null>(null)

const toggleType = () => {
  selectedType.value = selectedType.value === 'G' ? 'I' : 'G'
}

// Add this constant for the base URL
const R2_BASE_URL = 'https://pub-645e6a6aec9743558410b2ba6cedc346.r2.dev'

// Update these refs to store media type
const primaryMedia = ref<MediaItem | null>(null)
const additionalMedia = ref<MediaItem[]>([])

// Update the file input accept attribute to include videos
const acceptedFileTypes = "image/*,video/*"

// Add helper function to determine media type
const getMediaType = (file: File): 'image' | 'video' => {
  return file.type.startsWith('video/') ? 'video' : 'image'
}

// Update the handlePrimaryImageUpload function
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

      const result = await response.text()
      
      primaryMedia.value = {
        url: `${R2_BASE_URL}/${filename}`,
        mediaType
      }

    } catch (error) {
      console.error('Failed to upload media:', error)
    }
  }
}

// Update the handleAdditionalImageUpload function
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

      const result = await response.text()
      
      additionalMedia.value.push({
        url: `${R2_BASE_URL}/${filename}`,
        mediaType
      })

    } catch (error) {
      console.error('Failed to upload media:', error)
    }
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
const editorData = ref<EditorData>({
  time: Date.now(),
  blocks: [],
  version: '2.28.2'
})

// Update the initEditor function
const initEditor = () => {
  if (editor.value) return

  editor.value = new EditorJS({
    holder: 'editor',
    placeholder: 'Start writing your product description...',
    data: editorData.value, // Initialize with existing data
    tools: {
      header: {
        class: Header,
        inlineToolbar: true,
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
      },
      image: {
        class: ImageTool,
        config: {
          uploader: {
            uploadByFile(file: File) {
              return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onload = (e) => {
                  resolve({
                    success: 1,
                    file: {
                      url: e.target?.result
                    }
                  })
                }
                reader.readAsDataURL(file)
              })
            }
          }
        }
      },
      table: {
        class: Table,
        inlineToolbar: true,
        config: {
          rows: 2,
          cols: 3,
        },
      }
    },
    onChange: async () => {
      try {
        const savedData = await editor.value?.save()
        if (savedData) {
          editorData.value = savedData
        }
      } catch (error) {
        console.error('Failed to save editor data:', error)
      }
    }
  })
}

// Update the saveDescription function
const saveDescription = async () => {
  if (editor.value) {
    try {
      const savedData = await editor.value.save()
      editorData.value = savedData
      showDescriptionSheet.value = false
      
      // Clean up the editor
      editor.value.destroy()
      editor.value = null
    } catch (error) {
      console.error('Failed to save description:', error)
    }
  }
}

// Add a watch for the description sheet
watch(showDescriptionSheet, (newValue) => {
  if (newValue) {
    // Sheet is opening
    nextTick(() => {
      initEditor()
    })
  } else {
    // Sheet is closing
    if (editor.value) {
      editor.value.save().then(savedData => {
        editorData.value = savedData
        editor.value?.destroy()
        editor.value = null
      }).catch(error => {
        console.error('Failed to save editor data on close:', error)
      })
    }
  }
})

// Update the cleanup function
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.save().then(savedData => {
      editorData.value = savedData
      editor.value?.destroy()
      editor.value = null
    }).catch(error => {
      console.error('Failed to save editor data on unmount:', error)
    })
  }
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
const stockDetails = ref<{ [key: string]: StockDetails }>({})

// Add this method
const openStockDetails = (sku: string) => {
  if (!stockDetails.value[sku]) {
    stockDetails.value[sku] = {
      rows: [{
        group: '001',
        stock: 0,
        dom: '',
        shelfLife: ''
      }]
    }
  }
  showSkuSheet.value = true
}

// Add method to handle adding new rows
const addStockRow = (sku: string) => {
  if (!stockDetails.value[sku]) {
    stockDetails.value[sku] = {
      rows: []
    }
  }
  
  const nextGroup = getNextGroupNumber(stockDetails.value[sku].rows)
  stockDetails.value[sku].rows.push({
    group: nextGroup,
    stock: 0,
    dom: '',
    shelfLife: ''
  })
}

// Add this to handle auto-numbering for groups
const getNextGroupNumber = (rows: StockRow[]): string => {
  const num = (rows.length + 1).toString().padStart(3, '0')
  return num
}

// Add method to handle updates
const handleStockUpdate = () => {
  // Add your update logic here
  showSkuSheet.value = false
}

const openSkuDetails = (sku: GeneratedSku) => {
  selectedSku.value = sku
  showSkuSheet.value = true
}

// Add these refs
const showSkuDetailsSheet = ref(false)
const selectedSkuDetails = ref<GeneratedSku | null>(null)

// Add this ref to store SKU details
const skuDetailsData = ref<{ [key: string]: SkuDetails }>({})

// Add this method to initialize SKU details
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
}

// Update the openSkuDetailsSheet method
const openSkuDetailsSheet = (sku: GeneratedSku) => {
  selectedSkuDetails.value = sku
  initSkuDetails(sku.sku)  // Initialize SKU details if not exists
  
  // Initialize stock details if not exists
  if (!stockDetails.value[sku.sku]) {
    stockDetails.value[sku.sku] = {
      rows: [{
        group: '001',
        stock: 0,
        dom: '',
        shelfLife: ''
      }]
    }
  }
  showSkuDetailsSheet.value = true
}

// Add method to handle field updates
const updateSkuField = (field: keyof SkuDetails, value: string | number) => {
  if (selectedSkuDetails.value) {
    const sku = selectedSkuDetails.value.sku
    skuDetailsData.value[sku][field] = value
  }
}

// Add this computed property
const totalStock = computed(() => {
  const sku = selectedSkuDetails.value?.sku || ''
  return stockDetails.value[sku]?.rows.reduce((total, row) => total + (row.stock || 0), 0) || 0
})

// Add these refs and methods for SKU media handling
const skuMedia = ref<{ [key: string]: { primary: MediaItem | null; additional: MediaItem[] } }>({})
const skuPrimaryFileInput = ref<HTMLInputElement | null>(null)
const skuAdditionalFileInput = ref<HTMLInputElement | null>(null)

// Add these methods for SKU media handling
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

      const result = await response.text()
      
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

      const result = await response.text()
      
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

// Add this method to handle SKU media preview
const openSkuMediaPreview = (media: MediaItem, type: 'primary' | 'additional', index?: number) => {
  selectedMediaPreview.value = {
    url: media.url,
    mediaType: media.mediaType,
    type,
    index
  }
  showMediaPreviewSheet.value = true
}

// Keep only this version of removeMedia and remove the other one
const removeMedia = async () => {
  if (!selectedMediaPreview.value) return

  try {
    const filename = selectedMediaPreview.value.url.split('/').pop()
    if (!filename) throw new Error('Invalid file URL')

    const response = await fetch(`https://par.wetarteam.workers.dev/${filename}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete file')
    }

    // Handle both product and SKU media removal
    if (selectedSkuDetails.value) {
      const sku = selectedSkuDetails.value.sku
      if (selectedMediaPreview.value.type === 'primary') {
        skuMedia.value[sku].primary = null
      } else if (selectedMediaPreview.value.index !== undefined) {
        skuMedia.value[sku].additional.splice(selectedMediaPreview.value.index, 1)
      }
    } else {
      if (selectedMediaPreview.value.type === 'primary') {
        primaryMedia.value = null
      } else if (selectedMediaPreview.value.index !== undefined) {
        additionalMedia.value.splice(selectedMediaPreview.value.index, 1)
      }
    }

    showMediaPreviewSheet.value = false
    selectedMediaPreview.value = null

  } catch (error) {
    console.error('Failed to remove media:', error)
  }
}

// Add Date Picker Sheet
const showDatePickerSheet = ref(false)
const selectedDate = ref('')
const selectedRowIndex = ref<number | null>(null)

// Add these methods
const showDatePicker = (rowIndex: number) => {
  selectedRowIndex.value = rowIndex
  const currentRow = stockDetails.value[selectedSkuDetails.value?.sku || '']?.rows[rowIndex]
  if (currentRow?.dom) {
    selectedDate.value = currentRow.dom
  } else {
    selectedDate.value = new Date().toISOString().split('T')[0]
  }
  showDatePickerSheet.value = true
}

const handleDateSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  selectedDate.value = input.value
}

const confirmDateSelection = () => {
  if (selectedRowIndex.value !== null && selectedSkuDetails.value) {
    const sku = selectedSkuDetails.value.sku
    stockDetails.value[sku].rows[selectedRowIndex.value].dom = selectedDate.value
  }
  showDatePickerSheet.value = false
  selectedRowIndex.value = null
}

// Add these refs and methods
const showStockManagementSheet = ref(false)
const selectedSkuForStock = ref<GeneratedSku | null>(null)

const openStockManagementSheet = (sku: GeneratedSku) => {
  selectedSkuForStock.value = sku
  // Initialize stock details if not exists
  if (!stockDetails.value[sku.sku]) {
    stockDetails.value[sku.sku] = {
      rows: [{
        group: '001',
        stock: 0,
        dom: '',
        shelfLife: ''
      }]
    }
  }
  showStockManagementSheet.value = true
}

const getSkuTotalStock = (sku: string) => {
  return stockDetails.value[sku]?.rows.reduce((total, row) => total + (row.stock || 0), 0) || 0
}

// Add these refs for media preview
const showMediaPreviewSheet = ref(false)
const selectedMediaPreview = ref<MediaPreview | null>(null)

// Add this function to handle media preview
const openMediaPreview = (media: MediaItem, type: 'primary' | 'additional', index?: number) => {
  selectedMediaPreview.value = {
    url: media.url,
    mediaType: media.mediaType,
    type,
    index
  }
  showMediaPreviewSheet.value = true
}
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Replace the Fixed Header section -->
    <header class="sticky top-0 flex h-16 items-center justify-between border-b bg-white px-2 md:px-6 z-10">
      <div class="flex items-center">
        <Button variant="ghost" size="icon" class="mr-2" @click="goBack">
          <ArrowLeft class="h-5 w-5" />
          <span class="sr-only">Go back</span>
        </Button>
        <h1 class="text-sm font-semibold">Add Product</h1>
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

    <!-- Remove the empty space by removing or updating the div below header -->
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

        <!-- Replace the existing SKU table with this -->
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

    <!-- Keep the Sheet component outside the scrollable area -->
    <Sheet v-model:open="showConfirmationSheet">
      <!-- ... Sheet content remains the same ... -->
    </Sheet>

    <!-- Replace the Description Sheet -->
    <Sheet v-model:open="showDescriptionSheet">
      <SheetContent side="right" class="w-full">
        <div class="flex flex-col h-full">
          <!-- Top Bar -->
          <div class="flex items-center justify-between p-4 border-b">
            <Button 
              variant="ghost" 
              size="icon"
              @click="showDescriptionSheet = false"
              class="mr-auto"
            >
              <ArrowLeft class="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost"
              class="px-4"
              @click="saveDescription"
            >
              Save
            </Button>
          </div>

          <!-- Editor Area -->
          <div class="flex-1 px-4 overflow-y-auto">
            <div id="editor" />
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <Sheet v-model:open="showSkuSheet">
      <SheetContent side="bottom" class="h-screen">
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
            <div class="flex items-center border-b">
              <div class="w-24 p-3 border-r bg-gray-50">
                <span class="text-sm font-medium">UPC</span>
              </div>
              <div class="flex-1 p-2">
                <Input
                  :value="skuDetailsData[selectedSkuDetails?.sku || '']?.upc"
                  @input="e => updateSkuField('upc', (e.target as HTMLInputElement).value)"
                  type="text"
                  placeholder="Enter UPC"
                  class="w-full border-0 shadow-none focus:ring-0"
                  tabindex="-1"
                  :autofocus="false"
                />
              </div>
            </div>

            <!-- Images Row -->
            <div class="flex items-center border-b">
              <div class="w-32 border-r p-3">
                <div class="text-sm font-medium">Images</div>
              </div>
              <div class="flex-1 p-2">
                <div class="flex items-center gap-4">
                  <!-- Primary Media -->
                  <div class="flex-shrink-0">
                    <button 
                      @click="triggerSkuPrimaryFileInput"
                      class="w-12 h-12 rounded border flex items-center justify-center hover:bg-gray-50 relative overflow-hidden"
                      :class="{ 'border-dashed border-gray-300': !skuMedia[selectedSkuDetails?.sku]?.primary }"
                    >
                      <template v-if="skuMedia[selectedSkuDetails?.sku]?.primary">
                        <img 
                          v-if="skuMedia[selectedSkuDetails?.sku].primary.mediaType === 'image'"
                          :src="skuMedia[selectedSkuDetails?.sku].primary.url" 
                          class="w-full h-full object-cover cursor-pointer"
                          alt="Primary SKU media"
                          @click.stop="openSkuMediaPreview(skuMedia[selectedSkuDetails?.sku].primary, 'primary')"
                        />
                        <div 
                          v-else 
                          class="w-full h-full flex items-center justify-center cursor-pointer"
                          @click.stop="openSkuMediaPreview(skuMedia[selectedSkuDetails?.sku].primary, 'primary')"
                        >
                          <VideoIcon class="w-8 h-8 text-gray-400" />
                        </div>
                      </template>
                      <ImageIcon v-else class="w-6 h-6 text-gray-400" />
                    </button>
                    <input
                      ref="skuPrimaryFileInput"
                      type="file"
                      :accept="acceptedFileTypes"
                      class="hidden"
                      @change="handleSkuPrimaryUpload"
                    />
                  </div>

                  <!-- Additional Media -->
                  <div class="flex-1">
                    <div class="flex items-center gap-2 overflow-x-auto">
                      <div 
                        v-for="(media, index) in skuMedia[selectedSkuDetails?.sku]?.additional" 
                        :key="index"
                        class="flex-shrink-0 w-12 h-12 rounded border overflow-hidden cursor-pointer"
                        @click="openSkuMediaPreview(media, 'additional', index)"
                      >
                        <img 
                          v-if="media.mediaType === 'image'"
                          :src="media.url" 
                          class="w-full h-full object-cover"
                          alt="Additional SKU media"
                        />
                        <div 
                          v-else 
                          class="w-full h-full flex items-center justify-center"
                        >
                          <VideoIcon class="w-8 h-8 text-gray-400" />
                        </div>
                      </div>
                      
                      <button 
                        @click="triggerSkuAdditionalFileInput"
                        class="flex-shrink-0 w-12 h-12 rounded border border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus class="w-6 h-6 text-gray-400" />
                      </button>
                    </div>
                    <input
                      ref="skuAdditionalFileInput"
                      type="file"
                      :accept="acceptedFileTypes"
                      class="hidden"
                      @change="handleSkuAdditionalUpload"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Collection Row -->
            <div class="flex items-center border-b">
              <div class="w-32 border-r p-3">
                <div class="text-sm font-medium">Collection</div>
              </div>
              <div class="flex-1 p-2">
                <Input
                  :value="skuDetailsData[selectedSkuDetails?.sku || '']?.collection"
                  @input="e => updateSkuField('collection', (e.target as HTMLInputElement).value)"
                  type="text"
                  placeholder="Enter collection"
                  class="w-full border-0 shadow-none focus:ring-0"
                />
              </div>
            </div>

            <!-- Cost Row -->
            <div class="flex items-center border-b">
              <div class="w-32 border-r p-3">
                <div class="text-sm font-medium">Cost</div>
              </div>
              <div class="flex-1 p-2">
                <Input
                  :value="skuDetailsData[selectedSkuDetails?.sku || '']?.cost"
                  @input="e => updateSkuField('cost', Number((e.target as HTMLInputElement).value))"
                  type="number"
                  placeholder="0.00"
                  class="w-full border-0 shadow-none focus:ring-0"
                />
              </div>
            </div>

            <!-- Price Row -->
            <div class="flex items-center border-b">
              <div class="w-32 border-r p-3">
                <div class="text-sm font-medium">Price</div>
              </div>
              <div class="flex-1 p-2">
                <Input
                  :value="skuDetailsData[selectedSkuDetails?.sku || '']?.price"
                  @input="e => updateSkuField('price', Number((e.target as HTMLInputElement).value))"
                  type="number"
                  placeholder="0.00"
                  class="w-full border-0 shadow-none focus:ring-0"
                />
              </div>
            </div>

            <!-- MRP Row -->
            <div class="flex items-center">
              <div class="w-32 border-r p-3">
                <div class="text-sm font-medium">MRP</div>
              </div>
              <div class="flex-1 p-2">
                <Input
                  :value="skuDetailsData[selectedSkuDetails?.sku || '']?.mrp"
                  @input="e => updateSkuField('mrp', Number((e.target as HTMLInputElement).value))"
                  type="number"
                  placeholder="0.00"
                  class="w-full border-0 shadow-none focus:ring-0"
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Update the Table4 Sheet -->
    <Sheet v-model:open="showStockSheet">
      <SheetContent side="bottom" class="h-screen">
        <SheetHeader class="text-left">
          <div class="flex items-center justify-between">
            <SheetTitle>Stock Details</SheetTitle>
            <div class="flex gap-2">
              <Button 
                variant="outline"
                @click="addStockRow(selectedSku?.sku || '')"
              >
                <Plus class="h-4 w-4 mr-2" />
                Add
              </Button>
              <Button 
                @click="handleStockUpdate"
              >
                Update
              </Button>
            </div>
          </div>
          <SheetDescription>
            {{ selectedSku?.sku }}
          </SheetDescription>
        </SheetHeader>

        <div class="mt-6">
          <!-- Table4 -->
          <div class="border rounded-lg overflow-hidden">
            <!-- Header Row -->
            <div class="grid grid-cols-4 border-b bg-gray-50/50">
              <div class="p-3 border-r">
                <div class="text-sm font-medium">Group</div>
              </div>
              <div class="p-3 border-r">
                <div class="text-sm font-medium">Stock</div>
              </div>
              <div class="p-3 border-r">
                <div class="text-sm font-medium">DOM</div>
              </div>
              <div class="p-3">
                <div class="text-sm font-medium">Shelf Life</div>
              </div>
            </div>

            <!-- Data Rows -->
            <div 
              v-for="(row, index) in stockDetails[selectedSku?.sku || '']?.rows" 
              :key="index"
              class="grid grid-cols-4"
            >
              <div class="border-r">
                <input
                  :value="row.group"
                  type="text"
                  class="w-full py-3 px-4 bg-transparent border-0 focus:outline-none text-sm"
                  readonly
                />
              </div>
              <div class="border-r">
                <input
                  v-model.number="row.stock"
                  type="number"
                  class="w-full py-3 px-4 bg-transparent border-0 focus:outline-none text-sm"
                />
              </div>
              <div class="border-r">
                <input
                  v-model="row.dom"
                  type="text"
                  class="w-full py-3 px-4 bg-transparent border-0 focus:outline-none text-sm"
                  placeholder="mm/d"
                />
              </div>
              <div>
                <input
                  v-model="row.shelfLife"
                  type="text"
                  class="w-full py-3 px-4 bg-transparent border-0 focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Replace the existing SKU details sheet content -->
    <Sheet v-model:open="showSkuDetailsSheet">
      <SheetContent 
        side="bottom" 
        class="h-[100dvh] w-full !translate-y-0 !transition-none"
      >
        <div class="flex flex-col h-full">
          <!-- Header -->
          <div class="p-4 border-b">
            <h2 class="text-lg font-semibold">{{ selectedSkuDetails?.sku }}</h2>
            <p class="text-sm text-gray-500 mt-1">
              {{ category }} {{ selectedSkuDetails?.combination.map(pair => pair.split(': ')[1]).join(' ') }}
            </p>
          </div>

          <!-- Scrollable Content -->
          <div class="flex-1 overflow-y-auto p-4 space-y-6">
            <!-- Basic Info Table -->
            <div class="rounded-lg border bg-white overflow-hidden">
              <!-- UPC Row -->
              <div class="flex items-center border-b">
                <div class="w-24 p-3 border-r bg-gray-50">
                  <span class="text-sm font-medium">UPC</span>
                </div>
                <div class="flex-1 p-2">
                  <Input
                    :value="skuDetailsData[selectedSkuDetails?.sku || '']?.upc"
                    @input="e => updateSkuField('upc', (e.target as HTMLInputElement).value)"
                    type="text"
                    placeholder="Enter UPC"
                    class="w-full border-0 shadow-none focus:ring-0"
                    tabindex="-1"
                    :autofocus="false"
                  />
                </div>
              </div>

              <!-- Media Upload Row -->
              <div class="flex items-center border-b">
                <div class="w-24 p-3 border-r bg-gray-50">
                  <button 
                    @click="triggerSkuPrimaryFileInput"
                    class="w-12 h-12 rounded border flex items-center justify-center hover:bg-gray-50 relative overflow-hidden"
                    :class="{ 'border-dashed border-gray-300': !skuMedia[selectedSkuDetails?.sku]?.primary }"
                  >
                    <template v-if="skuMedia[selectedSkuDetails?.sku]?.primary">
                      <img 
                        v-if="skuMedia[selectedSkuDetails?.sku].primary.mediaType === 'image'"
                        :src="skuMedia[selectedSkuDetails?.sku].primary.url" 
                        class="w-full h-full object-cover cursor-pointer"
                        alt="Primary SKU media"
                        @click.stop="openSkuMediaPreview(skuMedia[selectedSkuDetails?.sku].primary, 'primary')"
                      />
                      <div 
                        v-else 
                        class="w-full h-full flex items-center justify-center cursor-pointer"
                        @click.stop="openSkuMediaPreview(skuMedia[selectedSkuDetails?.sku].primary, 'primary')"
                      >
                        <VideoIcon class="w-6 h-6 text-gray-400" />
                      </div>
                    </template>
                    <ImageIcon v-else class="w-4 h-4 text-gray-400" />
                  </button>
                  <input
                    ref="skuPrimaryFileInput"
                    type="file"
                    :accept="acceptedFileTypes"
                    class="hidden"
                    @change="handleSkuPrimaryUpload"
                  />
                </div>
                
                <div class="flex-1 p-2">
                  <div class="flex items-center gap-2 overflow-x-auto">
                    <!-- Uploaded Media -->
                    <div 
                      v-for="(media, index) in skuMedia[selectedSkuDetails?.sku]?.additional" 
                      :key="index"
                      class="flex-shrink-0 w-12 h-12 rounded border overflow-hidden cursor-pointer"
                      @click="openSkuMediaPreview(media, 'additional', index)"
                    >
                      <img 
                        v-if="media.mediaType === 'image'"
                        :src="media.url" 
                        class="w-full h-full object-cover"
                        alt="Additional SKU media"
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
                      @click="triggerSkuAdditionalFileInput"
                      class="flex-shrink-0 w-12 h-12 rounded border border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Plus class="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <input
                    ref="skuAdditionalFileInput"
                    type="file"
                    :accept="acceptedFileTypes"
                    class="hidden"
                    @change="handleSkuAdditionalUpload"
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
                    :value="skuDetailsData[selectedSkuDetails?.sku || '']?.collection"
                    @input="e => updateSkuField('collection', (e.target as HTMLInputElement).value)"
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
                    :value="skuDetailsData[selectedSkuDetails?.sku || '']?.cost"
                    @input="e => updateSkuField('cost', Number((e.target as HTMLInputElement).value))"
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
                    :value="skuDetailsData[selectedSkuDetails?.sku || '']?.price"
                    @input="e => updateSkuField('price', Number((e.target as HTMLInputElement).value))"
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
                    :value="skuDetailsData[selectedSkuDetails?.sku || '']?.mrp"
                    @input="e => updateSkuField('mrp', Number((e.target as HTMLInputElement).value))"
                    type="number"
                    placeholder="0.00"
                    class="w-full border-0 shadow-none focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Fixed Bottom Bar -->
          <div class="p-4 bg-white border-t">
            <Button class="w-full">Save Changes</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Add Date Picker Sheet -->
    <Sheet v-model:open="showDatePickerSheet">
      <SheetContent side="bottom" class="h-[400px]">
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

    <!-- Add this new sheet component -->
    <Sheet v-model:open="showStockManagementSheet">
      <SheetContent 
        side="bottom" 
        class="h-[100dvh] w-full !translate-y-0 !transition-none"
      >
        <div class="flex flex-col h-full">
          <!-- Header -->
          <div class="p-4 border-b">
            <h2 class="text-lg font-semibold">{{ selectedSkuForStock?.sku }}</h2>
            <p class="text-sm text-gray-500 mt-1">
              {{ category }} {{ selectedSkuForStock?.combination.map(pair => pair.split(': ')[1]).join(' ') }}
            </p>
          </div>

          <!-- Stock Management Table -->
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

          <!-- Fixed Bottom Bar -->
          <div class="p-4 bg-white border-t">
            <Button class="w-full" @click="showStockManagementSheet = false">
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Replace the Media Preview Sheet -->
    <Sheet v-model:open="showMediaPreviewSheet">
      <SheetContent side="bottom" class="h-[80vh]">
        <div class="relative h-full flex flex-col">
          <!-- Media preview -->
          <div class="flex-1 flex items-center justify-center">
            <img 
              v-if="selectedMediaPreview?.mediaType === 'image'"
              :src="selectedMediaPreview.url"
              class="max-h-full max-w-full object-contain"
              alt="Media preview"
            />
            <video
              v-else-if="selectedMediaPreview?.mediaType === 'video'"
              :src="selectedMediaPreview.url"
              controls
              class="max-h-full max-w-full"
            />
          </div>

          <!-- Bottom bar with remove button -->
          <div class="p-4 border-t bg-white">
            <button 
              @click="removeMedia"
              class="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              remove
            </button>
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

/* Rest of your existing styles... */
</style>






