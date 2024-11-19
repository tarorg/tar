<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Plus, Video as VideoIcon } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import AppHeader from '@/components/AppHeader.vue'

interface Product {
  id: number
  type: string
  product_name: string
  description: string
  medias: {
    primary: {
      url: string
      mediaType: 'image' | 'video'
    } | null
    additional: {
      url: string
      mediaType: 'image' | 'video'
    }[]
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

    // Create a mapping of column indices to names
    const colMapping = cols.reduce((acc: {[key: string]: number}, col: any, index: number) => {
      acc[col.name] = index
      return acc
    }, {})

    // Parse the results
    products.value = rows.map((row: any[]) => {
      try {
        return {
          id: Number(row[colMapping.id].value),
          type: row[colMapping.type].value,
          product_name: row[colMapping.product_name].value,
          description: row[colMapping.description].value,
          medias: JSON.parse(row[colMapping.medias].value),
          unit: row[colMapping.unit].value,
          category: row[colMapping.category].value,
          option1: row[colMapping.option1].value ? JSON.parse(row[colMapping.option1].value) : null,
          option2: row[colMapping.option2].value ? JSON.parse(row[colMapping.option2].value) : null,
          option3: row[colMapping.option3].value ? JSON.parse(row[colMapping.option3].value) : null,
          totalstock: Number(row[colMapping.totalstock].value),
          items: JSON.parse(row[colMapping.items].value),
          created_at: row[colMapping.created_at].value,
          updated_at: row[colMapping.updated_at].value
        }
      } catch (parseError) {
        console.error('Error parsing row:', row, parseError)
        return null
      }
    }).filter(Boolean)

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
    product.product_name.toLowerCase().includes(query) ||
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
                <div class="text-sm font-medium">{{ product.product_name }}</div>
                <div class="text-xs text-gray-500">
                  {{ getVariantCount(product) }}&nbsp;&nbsp;{{ product.category }}
                </div>
              </div>

              <!-- Stock Column - adjusted padding to match SKU rows -->
              <div class="w-[80px] flex justify-end px-4">
                <div class="w-[50px] text-right">
                  {{ product.totalstock }}
                </div>
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
                <!-- Stock Column -->
                <div class="w-[80px] flex justify-end">
                  <div class="w-[50px] text-right">
                    {{ item.stock }}
                  </div>
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