<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Plus, Video as VideoIcon, EyeOff } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import AppHeader from '@/components/AppHeader.vue'

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
  // SEO and URLs
  handle: string
  pagetitle: string
  metadesc: string
  // Organization
  unit: string
  category: string
  vendor: string
  collections: string[]
  tags: string[]
  // Options and Variants
  option1: string | null
  option2: string | null
  option3: string | null
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
  // Inventory
  totalstock: number
  trackquantity: boolean
  continueselling: boolean
  // Status and Visibility
  status: 'draft' | 'published'
  publishedat: string | null
  saleschannels: string[]
  visibility: 'visible' | 'hidden'
  // Shipping
  weight: number | null
  weightunit: string
  // Timestamps
  createdat: string
  updatedat: string
  active: boolean
}

interface MediaItem {
  url: string
  mediaType: 'image' | 'video'
}

const products = ref<Product[]>([])
const isLoading = ref(true)
const searchQuery = ref('')

// Add loading state
const loadError = ref<string | null>(null)

// Add this ref for tracking expanded products
const expandedProducts = ref<number[]>([])

// Fetch products from Turso
const fetchProducts = async () => {
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
            sql: "SELECT * FROM products",
            args: []
          }
        }]
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Server response:', errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('Raw API Response:', result)

    // Get the column definitions and rows
    const cols = result?.results?.[0]?.response?.result?.cols || []
    const rows = result?.results?.[0]?.response?.result?.rows || []

    if (rows.length === 0) {
      console.log('No products found')
      products.value = []
      return
    }

    // Update the column mapping to exclude columns 4,5
    const colMapping = cols.reduce((acc: {[key: string]: number}, col: any, index: number) => {
      // Skip columns 4 and 5
      if (col.name !== 'option4' && col.name !== 'option5') {
        acc[col.name] = index
      }
      return acc
    }, {})

    // Update the safeJsonParse function to be more robust
    const safeJsonParse = (value: string | null, defaultValue: any = null) => {
      if (!value) return defaultValue
      if (typeof value !== 'string') return value

      try {
        // First try direct parsing
        return JSON.parse(value)
      } catch (e) {
        try {
          // Try cleaning the string first
          const cleaned = value
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            .replace(/\f/g, '\\f')
            .replace(/[\u0000-\u0019]+/g, '') // Remove control characters
            .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":') // Ensure property names are quoted
            .replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double quotes
            .replace(/\\\\/g, '\\') // Fix double escaped backslashes
            .replace(/\\"/g, '"') // Fix escaped quotes
            .replace(/"{/g, '{') // Remove quotes around objects
            .replace(/}"/g, '}') // Remove quotes around objects
            
          return JSON.parse(cleaned)
        } catch (e2) {
          console.error('JSON parse error after cleaning:', e2, 'Original value:', value)
          return defaultValue
        }
      }
    }

    // Update the parseItems function
    const parseItems = (itemsValue: string | null) => {
      if (!itemsValue) return []
      try {
        // If itemsValue is already parsed
        if (Array.isArray(itemsValue)) {
          return itemsValue
        }

        // Try to parse if it's a string
        let parsed = itemsValue
        if (typeof itemsValue === 'string') {
          // Clean up the string first
          parsed = itemsValue
            .replace(/\\/g, '') // Remove backslashes
            .replace(/"{/g, '{') // Remove quotes around objects
            .replace(/}"/g, '}') // Remove quotes around objects
            .replace(/\\"/g, '"') // Fix escaped quotes
          
          parsed = JSON.parse(parsed)
        }

        if (!Array.isArray(parsed)) {
          console.error('Items value is not an array:', parsed)
          return []
        }

        return parsed.map(item => ({
          SKU: item.SKU || '',
          desc: item.desc || '',
          upc: item.upc || '',
          medias: typeof item.medias === 'string' 
            ? item.medias.replace(/\\/g, '')  // Clean up nested JSON
            : JSON.stringify(item.medias),
          collection: item.collection || '',
          cost: Number(item.cost || 0),
          price: Number(item.price || 0),
          MRP: Number(item.MRP || 0),
          stock: Number(item.stock || 0)
        }))
      } catch (e) {
        console.error('Error parsing items:', e, 'Original value:', itemsValue)
        return []
      }
    }

    // Update the products mapping
    products.value = rows.map((row: any[]) => {
      try {
        // Parse medias
        let mediasData = { primary: null, additional: [] }
        try {
          const mediasRaw = row[colMapping.medias]?.value
          if (mediasRaw) {
            const parsed = safeJsonParse(mediasRaw)
            if (parsed && typeof parsed === 'object') {
              mediasData = {
                primary: parsed.primary || null,
                additional: Array.isArray(parsed.additional) ? parsed.additional : []
              }
            }
          }
        } catch (e) {
          console.error('Error parsing medias:', e)
        }

        // Parse options (1-3 only)
        const parseOption = (optionValue: string | null) => {
          if (!optionValue) return null
          try {
            const parsed = safeJsonParse(optionValue)
            if (parsed && typeof parsed === 'object') {
              const entries = Object.entries(parsed)
              if (entries.length === 1) {
                const [key, value] = entries[0]
                return { [key]: Array.isArray(value) ? value : [value] }
              }
            }
            return null
          } catch (e) {
            console.error('Error parsing option:', e)
            return null
          }
        }

        return {
          id: Number(row[colMapping.id]?.value || 0),
          storeid: row[colMapping.storeid]?.value || '',
          type: row[colMapping.type]?.value || '',
          prodtype: row[colMapping.prodtype]?.value || 'physical',
          productname: row[colMapping.productname]?.value || '',
          description: row[colMapping.description]?.value || '',
          medias: mediasData,
          handle: row[colMapping.handle]?.value || '',
          pagetitle: row[colMapping.pagetitle]?.value || '',
          metadesc: row[colMapping.metadesc]?.value || '',
          unit: row[colMapping.unit]?.value || '',
          category: row[colMapping.category]?.value || '',
          vendor: row[colMapping.vendor]?.value || '',
          collections: safeJsonParse(row[colMapping.collections]?.value, []),
          tags: safeJsonParse(row[colMapping.tags]?.value, []),
          option1: parseOption(row[colMapping.option1]?.value),
          option2: parseOption(row[colMapping.option2]?.value),
          option3: parseOption(row[colMapping.option3]?.value),
          items: parseItems(row[colMapping.items]?.value),
          totalstock: Number(row[colMapping.totalstock]?.value || 0),
          trackquantity: Boolean(row[colMapping.trackquantity]?.value),
          continueselling: Boolean(row[colMapping.continueselling]?.value),
          status: row[colMapping.status]?.value || 'draft',
          publishedat: row[colMapping.publishedat]?.value || null,
          saleschannels: safeJsonParse(row[colMapping.saleschannels]?.value, []),
          visibility: row[colMapping.visibility]?.value || 'visible',
          weight: row[colMapping.weight]?.value ? Number(row[colMapping.weight].value) : null,
          weightunit: row[colMapping.weightunit]?.value || 'kg',
          createdat: row[colMapping.createdat]?.value || '',
          updatedat: row[colMapping.updatedat]?.value || '',
          active: Boolean(row[colMapping.active]?.value)
        }
      } catch (error) {
        console.error('Error parsing row:', error, row)
        return null
      }
    }).filter(Boolean) as Product[]

    console.log('Parsed products:', products.value)

  } catch (error) {
    console.error('Failed to fetch products:', error)
    loadError.value = 'Failed to load products. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// Filter products based on search query
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  
  const query = searchQuery.value.toLowerCase()
  return products.value.filter(product => 
    product.productname.toLowerCase().includes(query) ||
    product.category.toLowerCase().includes(query) ||
    product.items.some(item => item.SKU.toLowerCase().includes(query))
  )
})

// Navigate to add product page
const addProduct = () => {
  navigateTo('/add-product')
}

// Format options for display
const formatOptions = (product: Product) => {
  const options = []
  if (product.option1) options.push(Object.entries(product.option1)[0])
  if (product.option2) options.push(Object.entries(product.option2)[0])
  if (product.option3) options.push(Object.entries(product.option3)[0])
  
  return options.map(([key, values]) => `${key}: ${Array.isArray(values) ? values.join(', ') : values}`).join(' | ')
}

// Add this computed property to get variant count
const getVariantCount = (product: Product) => {
  return product.items?.length || 0
}

// Modify the toggleExpand function to handle row expansion
const toggleExpand = (productId: number) => {
  const index = expandedProducts.value.indexOf(productId)
  if (index === -1) {
    expandedProducts.value = [productId] // Only allow one expanded row at a time
  } else {
    expandedProducts.value = []
  }
}

// Add a function to check if a product is expanded
const isExpanded = (productId: number) => {
  return expandedProducts.value.includes(productId)
}

onMounted(() => {
  fetchProducts()
})
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Add AppHeader at the top -->
    <AppHeader />

    <!-- Search Bar with Add Button -->
    <div class="p-4 flex gap-2 items-center">
      <div class="flex-1 relative">
        <Input
          v-model="searchQuery"
          type="text"
          placeholder="Search products..."
          class="w-full"
        />
      </div>
      <Button @click="addProduct" variant="ghost" size="icon" class="h-10 w-10">
        <Plus class="h-5 w-5" />
      </Button>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-auto">
      <div class="w-full">
        <div class="w-full">
          <template v-for="product in filteredProducts" :key="product.id">
            <!-- Main Product Row -->
            <div 
              class="flex w-full border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
              @click="toggleExpand(product.id)"
            >
              <!-- Image Column -->
              <div class="w-[80px] p-3">
                <div 
                  class="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 cursor-pointer"
                  @click.stop="navigateTo(`/edit-product/${product.id}`)"
                >
                  <template v-if="product.medias?.primary">
                    <img 
                      v-if="product.medias.primary.mediaType === 'image'"
                      :src="product.medias.primary.url"
                      class="w-full h-full object-cover"
                      alt="Product"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <VideoIcon class="w-6 h-6 text-gray-400" />
                    </div>
                  </template>
                </div>
              </div>

              <!-- Product Name Column -->
              <div class="flex-1 p-3 flex flex-col justify-center">
                <div class="text-sm font-medium">{{ product.productname }}</div>
                <div class="text-xs text-gray-500">
                  {{ getVariantCount(product) }}&nbsp;&nbsp;{{ product.category }}
                </div>
              </div>

              <!-- Stock Column - Adjusted for perfect alignment -->
              <div class="w-[50px] flex items-center justify-end mr-4">
                {{ product.totalstock }}
              </div>
            </div>

            <!-- Expanded SKU Details -->
            <div 
              v-if="isExpanded(product.id)"
              class="w-full bg-gray-50 border-b border-gray-200"
            >
              <!-- SKU Items -->
              <div 
                v-for="item in product.items" 
                :key="item.SKU"
                class="flex w-full py-2 px-4 text-sm border-b border-gray-100 last:border-0"
              >
                <!-- SKU Column -->
                <div class="flex-1">{{ item.SKU }}</div>
                <!-- Stock Column - Matched with parent -->
                <div class="w-[50px] flex items-center justify-end mr-4">
                  {{ item.stock }}
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
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

/* Add these new styles */
.expanded-row {
  background-color: rgb(249, 250, 251);
  transition: all 0.2s ease;
}

.cursor-pointer {
  cursor: pointer;
}
</style> 