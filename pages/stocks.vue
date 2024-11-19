<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Plus, Video as VideoIcon } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import AppHeader from '@/components/AppHeader.vue'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface StockItem {
  id: number
  product_name: string
  category: string
  SKU: string
  desc: string
  stock: number
  medias: {
    primary: {
      url: string
      mediaType: 'image' | 'video'
    } | null
  }
}

const stocks = ref<StockItem[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const loadError = ref<string | null>(null)
const isSkuDetailsOpen = ref(false)
const isStockManagementOpen = ref(false)
const selectedStock = ref<StockItem | null>(null)

// Add these refs for SKU details management
const skuDetailsData = ref<{ [key: string]: SkuDetails }>({})
const stockDetails = ref<{ [key: string]: StockDetails }>({})
const selectedDate = ref('')
const selectedRowIndex = ref<number | null>(null)

// Add this ref at the top with other refs
const showDatePickerSheet = ref(false)

interface SkuDetails {
  upc: string
  collection: string
  cost: number
  price: number
  mrp: number
}

interface StockDetails {
  rows: StockRow[]
}

interface StockRow {
  group: string
  stock: number
  dom: string
  shelfLife: string
}

// Fetch products and flatten to SKU level
const fetchStocks = async () => {
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
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    const cols = result?.results?.[0]?.response?.result?.cols || []
    const rows = result?.results?.[0]?.response?.result?.rows || []

    // Create a mapping of column indices to names
    const colMapping = cols.reduce((acc: {[key: string]: number}, col: any, index: number) => {
      acc[col.name] = index
      return acc
    }, {})

    // Flatten products to SKU level
    const flattenedStocks: StockItem[] = []
    
    rows.forEach((row: any[]) => {
      try {
        const product = {
          id: Number(row[colMapping.id].value),
          product_name: row[colMapping.product_name].value,
          category: row[colMapping.category].value,
          medias: JSON.parse(row[colMapping.medias].value),
          items: JSON.parse(row[colMapping.items].value)
        }

        // Add each SKU as a separate item and preload details
        product.items.forEach((item: any) => {
          const sku = item.SKU
          
          // Preload SKU details
          skuDetailsData.value[sku] = {
            upc: item.upc || '',
            collection: item.collection || '',
            cost: item.cost || 0,
            price: item.price || 0,
            mrp: item.MRP || 0
          }

          // Preload stock details
          stockDetails.value[sku] = {
            rows: [{
              group: '001',
              stock: item.stock || 0,
              dom: '',
              shelfLife: ''
            }]
          }

          // Add to flattened stocks
          flattenedStocks.push({
            id: product.id,
            product_name: product.product_name,
            category: product.category,
            SKU: sku,
            desc: item.desc,
            stock: item.stock,
            medias: product.medias
          })
        })
      } catch (parseError) {
        console.error('Error parsing row:', parseError)
      }
    })

    stocks.value = flattenedStocks
  } catch (error) {
    console.error('Failed to fetch stocks:', error)
    loadError.value = 'Failed to load stocks. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// Filter stocks based on search query
const filteredStocks = computed(() => {
  if (!searchQuery.value) return stocks.value
  
  const query = searchQuery.value.toLowerCase()
  return stocks.value.filter(stock => 
    stock.SKU.toLowerCase().includes(query) ||
    stock.product_name.toLowerCase().includes(query) ||
    stock.category.toLowerCase().includes(query)
  )
})

// Add methods for SKU details management
const updateSkuField = (field: keyof SkuDetails, value: string | number) => {
  if (selectedStock.value) {
    const sku = selectedStock.value.SKU
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
  if (selectedRowIndex.value !== null && selectedStock.value) {
    const sku = selectedStock.value.SKU
    stockDetails.value[sku].rows[selectedRowIndex.value].dom = selectedDate.value
  }
  showDatePickerSheet.value = false
  selectedRowIndex.value = null
}

// Remove initSkuDetails since data is now preloaded
const openSkuDetails = (stock: StockItem) => {
  selectedStock.value = stock
  isSkuDetailsOpen.value = true
}

const openStockManagement = (stock: StockItem, event: Event) => {
  event.stopPropagation()
  selectedStock.value = stock
  // Initialize stock details if not exists
  if (!stockDetails.value[stock.SKU]) {
    stockDetails.value[stock.SKU] = {
      rows: [{
        group: '001',
        stock: stock.stock,
        dom: '',
        shelfLife: ''
      }]
    }
  }
  isStockManagementOpen.value = true
}

// Add method to get total stock
const getSkuTotalStock = (sku: string) => {
  return stockDetails.value[sku]?.rows.reduce((total, row) => total + (row.stock || 0), 0) || 0
}

onMounted(() => {
  fetchStocks()
})
</script>

<template>
  <div class="flex flex-col h-screen">
    <AppHeader />

    <!-- Search Bar with Add Button -->
    <div class="p-4 flex gap-2 items-center">
      <div class="flex-1 relative">
        <Input
          v-model="searchQuery"
          type="text"
          placeholder="Search stocks..."
          class="w-full"
        />
      </div>
      <Button @click="() => navigateTo('/add-product')" variant="ghost" size="icon" class="h-10 w-10">
        <Plus class="h-5 w-5" />
      </Button>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-auto">
      <div class="w-full">
        <div class="w-full">
          <template v-for="stock in filteredStocks" :key="`${stock.id}-${stock.SKU}`">
            <!-- Stock Row -->
            <div class="flex w-full border-b border-gray-200 hover:bg-gray-50">
              <!-- Image Column -->
              <div class="w-[80px] p-3">
                <div 
                  class="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 cursor-pointer"
                  @click="openSkuDetails(stock)"
                >
                  <template v-if="stock.medias?.primary">
                    <img 
                      v-if="stock.medias.primary.mediaType === 'image'"
                      :src="stock.medias.primary.url"
                      class="w-full h-full object-cover"
                      alt="Product"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <VideoIcon class="w-6 h-6 text-gray-400" />
                    </div>
                  </template>
                </div>
              </div>

              <!-- SKU and Product Info Column -->
              <div class="flex-1 p-3 flex flex-col justify-center">
                <div class="text-sm font-medium">{{ stock.SKU }}</div>
                <div class="text-xs text-gray-500">
                  {{ stock.product_name }}&nbsp;&nbsp;{{ stock.category }}
                </div>
              </div>

              <!-- Stock Column - Added click handler -->
              <div 
                class="w-[50px] flex items-center justify-end mr-4 cursor-pointer"
                @click.stop="openStockManagement(stock, $event)"
              >
                {{ stock.stock }}
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- SKU Details Sheet -->
    <Sheet v-model:open="isSkuDetailsOpen">
      <SheetContent 
        side="bottom" 
        class="h-[100dvh] w-full !translate-y-0 !transition-none"
      >
        <SheetHeader>
          <SheetTitle>SKU Details</SheetTitle>
          <SheetDescription>
            {{ selectedStock?.SKU }} - {{ selectedStock?.product_name }}
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
                  :model-value="skuDetailsData[selectedStock?.SKU || '']?.upc"
                  @update:model-value="value => updateSkuField('upc', value)"
                  type="text"
                  placeholder="Enter UPC"
                  class="w-full border-0 shadow-none focus:ring-0 bg-transparent no-cursor"
                  :autofocus="false"
                  tabindex="-1"
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
                  :model-value="skuDetailsData[selectedStock?.SKU || '']?.collection"
                  @update:model-value="value => updateSkuField('collection', value)"
                  type="text"
                  placeholder="Enter collection"
                  class="w-full border-0 shadow-none focus:ring-0 bg-transparent no-cursor"
                  :autofocus="false"
                  tabindex="-1"
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
                  :model-value="skuDetailsData[selectedStock?.SKU || '']?.cost"
                  @update:model-value="value => updateSkuField('cost', Number(value))"
                  type="number"
                  placeholder="0.00"
                  class="w-full border-0 shadow-none focus:ring-0 bg-transparent no-cursor"
                  :autofocus="false"
                  tabindex="-1"
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
                  :model-value="skuDetailsData[selectedStock?.SKU || '']?.price"
                  @update:model-value="value => updateSkuField('price', Number(value))"
                  type="number"
                  placeholder="0.00"
                  class="w-full border-0 shadow-none focus:ring-0 bg-transparent no-cursor"
                  :autofocus="false"
                  tabindex="-1"
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
                  :model-value="skuDetailsData[selectedStock?.SKU || '']?.mrp"
                  @update:model-value="value => updateSkuField('mrp', Number(value))"
                  type="number"
                  placeholder="0.00"
                  class="w-full border-0 shadow-none focus:ring-0 bg-transparent no-cursor"
                  :autofocus="false"
                  tabindex="-1"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-white border-t">
          <Button class="w-full" @click="isSkuDetailsOpen = false">
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Stock Management Sheet -->
    <Sheet v-model:open="isStockManagementOpen">
      <SheetContent 
        side="bottom" 
        class="h-[100dvh] w-full !translate-y-0 !transition-none"
      >
        <SheetHeader>
          <SheetTitle>Stock Management</SheetTitle>
          <SheetDescription>
            {{ selectedStock?.SKU }} - {{ selectedStock?.product_name }}
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
                @click="addStockRow(selectedStock?.SKU || '')"
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
                v-for="(row, index) in stockDetails[selectedStock?.SKU || '']?.rows" 
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
                    class="w-full border-0 shadow-none focus:ring-0 p-0 text-center bg-transparent"
                  />
                </div>
                <div class="p-3 border-r">
                  <Input
                    v-model="row.dom"
                    type="date"
                    class="w-full border-0 shadow-none focus:ring-0 p-0 text-center bg-transparent [&::-webkit-calendar-picker-indicator]:hidden"
                    @click="showDatePicker(index)"
                  />
                </div>
                <div class="p-3">
                  <Input
                    v-model="row.shelfLife"
                    type="text"
                    class="w-full border-0 shadow-none focus:ring-0 p-0 text-center bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 bg-white border-t">
          <Button class="w-full" @click="isStockManagementOpen = false">
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

.cursor-pointer {
  cursor: pointer;
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
  }

  .border-r,
  .border-b {
    border-color: rgb(229 231 235) !important;
  }
}

/* Add these new styles */
.no-cursor {
  caret-color: transparent !important;
}

.no-cursor:focus {
  caret-color: transparent !important;
}

:deep(input) {
  caret-color: transparent !important;
}

:deep(input:focus) {
  caret-color: transparent !important;
}

/* Add these additional styles to prevent focus effects */
:deep(.sheet-content) {
  * {
    -webkit-tap-highlight-color: transparent !important;
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