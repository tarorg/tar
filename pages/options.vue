<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Package,
  Square,
  Triangle,
  Circle,
  Settings,
  Plus,
  Search,
  Image as ImageIcon,
} from 'lucide-vue-next'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { initDB, saveAttributes, getAttributes, saveOptions, getOptions, dbStatus } from '@/services/indexedDB'

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
  identifier: string
}

const menuSearchQuery = ref('')
const optionSearchQuery = ref('')
const selectedAttribute = ref('color')
const editingId = ref<number | null>(null)
const editingCell = ref<'visual' | 'value' | 'identifier' | null>(null)
const tempEditValue = ref('')
const showColorPicker = ref(false)
const selectedOption = ref<OptionValue | null>(null)
const colorCode = ref('')

// Add refs for custom attribute creation
const showAddAttributeSheet = ref(false)
const newAttributeName = ref('')
const newAttributeType = ref('text')

// Modified attribute options with type
const attributeOptions = ref<AttributeOption[]>([
  { value: 'color', label: 'Color', type: 'color' },
  { value: 'size', label: 'Size', type: 'text' },
  { value: 'material', label: 'Material', type: 'text' },
])

// Sample option values
const optionValues = ref<OptionValue[]>([
  { id: 1, attribute: 'color', value: 'Red', visual: '#FF0000', type: 'color', identifier: 'red' },
  { id: 2, attribute: 'color', value: 'Blue', visual: '#0000FF', type: 'color', identifier: 'blue' },
  { id: 3, attribute: 'size', value: 'Small', visual: 'S', type: 'text', identifier: 'small' },
  { id: 4, attribute: 'size', value: 'Medium', visual: 'M', type: 'text', identifier: 'medium' },
  { id: 5, attribute: 'material', value: 'Cotton', visual: '🧵', type: 'text', identifier: 'cotton' },
  { id: 6, attribute: 'material', value: 'Leather', visual: '🥬', type: 'text', identifier: 'leather' },
])

const filteredValues = computed(() => {
  return optionValues.value.filter(option => 
    option.attribute === selectedAttribute.value &&
    option.value.toLowerCase().includes(optionSearchQuery.value.toLowerCase())
  )
})

const addCustomAttribute = () => {
  if (newAttributeName.value.trim()) {
    const value = newAttributeName.value.toLowerCase().replace(/\s+/g, '-')
    attributeOptions.value.push({
      value,
      label: newAttributeName.value.trim(),
      type: newAttributeType.value
    })
    selectedAttribute.value = value
    newAttributeName.value = ''
    showAddAttributeSheet.value = false
  }
}

const addNewRow = () => {
  const attribute = attributeOptions.value.find(a => a.value === selectedAttribute.value)
  const newId = optionValues.value.length + 1
  const newOption = {
    id: newId,
    attribute: selectedAttribute.value,
    value: '',
    visual: attribute?.type === 'color' ? '#CCCCCC' : '',
    type: attribute?.type || 'text',
    identifier: ''
  }
  optionValues.value.push(newOption)
}

const openColorPicker = (option: OptionValue) => {
  if (option.attribute === 'color') {
    selectedOption.value = option
    colorCode.value = option.visual
    showColorPicker.value = true
  } else {
    startEditing(option, 'visual')
  }
}

const saveColor = () => {
  if (selectedOption.value) {
    const option = optionValues.value.find(o => o.id === selectedOption.value.id)
    if (option) {
      option.visual = colorCode.value
    }
  }
  showColorPicker.value = false
  selectedOption.value = null
}

const startEditing = (option: any, cell: 'visual' | 'value' | 'identifier') => {
  editingId.value = option.id
  editingCell.value = cell
  tempEditValue.value = cell === 'value' ? option.value : cell === 'identifier' ? option.identifier : option.visual
}

const saveEdit = (option: any) => {
  if (editingId.value === option.id && editingCell.value) {
    const updatedOption = optionValues.value.find(o => o.id === option.id)
    if (updatedOption) {
      if (editingCell.value === 'value') {
        updatedOption.value = tempEditValue.value
      } else if (editingCell.value === 'identifier') {
        updatedOption.identifier = tempEditValue.value
      } else {
        updatedOption.visual = tempEditValue.value
      }
    }
  }
  editingId.value = null
  editingCell.value = null
  tempEditValue.value = ''
}

const handleKeyDown = (e: KeyboardEvent, option: any) => {
  if (e.key === 'Enter') {
    saveEdit(option)
  } else if (e.key === 'Escape') {
    editingId.value = null
    editingCell.value = null
    tempEditValue.value = ''
  }
}

const toggleVisualType = (option: any) => {
  if (selectedAttribute.value === 'color') return // Color always stays as color
  const updatedOption = optionValues.value.find(o => o.id === option.id)
  if (updatedOption) {
    updatedOption.type = updatedOption.type === 'text' ? 'image' : 'text'
  }
}

const menuItems = [
  { icon: Settings, label: 'Settings' },
  { icon: Package, label: 'Products', link: '/products' },
]

const filteredMenuItems = computed(() => {
  return menuItems.filter(item => 
    item.label.toLowerCase().includes(menuSearchQuery.value.toLowerCase())
  )
})

// Add loading state
const isLoading = ref(true)

// Add initialization code
onMounted(async () => {
  try {
    await initDB()
    
    // Load saved data
    const savedAttributes = await getAttributes()
    const savedOptions = await getOptions()
    
    if (savedAttributes.length > 0) {
      attributeOptions.value = savedAttributes
    } else {
      // Save default attributes if none exist
      await saveAttributes(attributeOptions.value)
    }
    
    if (savedOptions.length > 0) {
      optionValues.value = savedOptions
    } else {
      // Save default options if none exist
      await saveOptions(optionValues.value)
    }
  } catch (error) {
    console.error('Failed to initialize database:', error)
  } finally {
    isLoading.value = false
  }
})

// Add watchers to save changes
watch(attributeOptions, async (newValue) => {
  if (dbStatus.value === 'ready') {
    try {
      await saveAttributes(newValue)
    } catch (error) {
      console.error('Failed to save attributes:', error)
    }
  }
}, { deep: true })

watch(optionValues, async (newValue) => {
  if (dbStatus.value === 'ready') {
    try {
      await saveOptions(newValue)
    } catch (error) {
      console.error('Failed to save options:', error)
    }
  }
}, { deep: true })
</script>

<template>
  <div class="flex flex-col min-h-screen w-full">
    <!-- Header with menu -->
    <header class="sticky top-0 flex h-16 items-center border-b bg-white px-2 md:px-6 z-10">
      <div class="flex w-full items-center">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="secondary" size="icon" class="rounded-full">
              <Square class="h-5 w-5" />
              <span class="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-screen md:w-56">
            <div class="p-2">
              <div class="relative w-full items-center">
                <Input 
                  v-model="menuSearchQuery"
                  type="text" 
                  placeholder="Search menu..." 
                  class="text-xl"
                />
              </div>
            </div>
            <DropdownMenuGroup>
              <template v-for="item in filteredMenuItems" :key="item.label">
                <DropdownMenuItem class="text-xl py-2">
                  <component :is="item.icon" class="mr-2 h-5 w-5" />
                  <span v-if="item.link">
                    <NuxtLink :to="item.link" class="flex items-center">
                      {{ item.label }}
                    </NuxtLink>
                  </span>
                  <span v-else>{{ item.label }}</span>
                </DropdownMenuItem>
              </template>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <div class="flex-1"></div>
        <div class="flex items-center">
          <Button variant="ghost" size="icon" class="rounded-full">
            <Triangle class="h-5 w-5" />
            <span class="sr-only">Triangle</span>
          </Button>
          <Button variant="ghost" size="icon" class="rounded-full">
            <Circle class="h-5 w-5" />
            <span class="sr-only">Circle</span>
          </Button>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <div class="flex-1 p-6">
      <div v-if="isLoading" class="flex items-center justify-center h-full">
        <div class="text-lg">Loading...</div>
      </div>
      <div v-else class="max-w-4xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">Attribute Options</h1>
        </div>

        <!-- Attribute selector and search -->
        <div class="flex gap-4 items-center">
          <div class="flex gap-2 items-center">
            <Select v-model="selectedAttribute" class="w-[200px]">
              <SelectTrigger>
                <SelectValue placeholder="Select attribute" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in attributeOptions" 
                           :key="option.value" 
                           :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              @click="showAddAttributeSheet = true"
            >
              <Plus class="h-4 w-4" />
            </Button>
          </div>

          <div class="flex-1 relative">
            <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="optionSearchQuery"
              placeholder="Search options..."
              class="pl-8"
            />
          </div>

          <Button variant="outline" size="icon" @click="addNewRow">
            <Plus class="h-4 w-4" />
          </Button>
        </div>

        <!-- Options table -->
        <div class="border rounded-lg overflow-hidden">
          <div class="grid grid-cols-[80px_1fr_1fr] bg-white">
            <!-- Table headers -->
            <div class="p-3 font-medium text-sm text-muted-foreground border-b">
              Visual
            </div>
            <div class="p-3 font-medium text-sm text-muted-foreground border-b">
              Value
            </div>
            <div class="p-3 font-medium text-sm text-muted-foreground border-b">
              Identifier
            </div>

            <!-- Table rows -->
            <template v-for="option in filteredValues" :key="option.id">
              <!-- Visual cell -->
              <div class="p-3 flex items-center justify-center group relative hover:bg-gray-50/50 transition-colors"
                   @click="openColorPicker(option)">
                <template v-if="editingId === option.id && editingCell === 'visual' && option.attribute !== 'color'">
                  <input
                    type="text"
                    v-model="tempEditValue"
                    class="w-full p-1 outline-none border-none bg-transparent"
                    @blur="saveEdit(option)"
                    @keydown="handleKeyDown($event, option)"
                  />
                </template>
                <template v-else>
                  <div v-if="option.attribute === 'color'" 
                       class="w-8 h-8 rounded-md cursor-pointer shadow-sm ring-1 ring-inset ring-gray-200"
                       :style="{ backgroundColor: option.visual }" />
                  <span v-else-if="option.type === 'text'" 
                        class="text-sm font-medium cursor-pointer w-8 h-8 flex items-center justify-center">
                    {{ option.visual }}
                  </span>
                  <img v-else 
                       :src="option.visual" 
                       class="w-8 h-8 object-cover rounded-md shadow-sm ring-1 ring-inset ring-gray-200" />
                  
                  <button v-if="option.attribute !== 'color'"
                          class="absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                          @click.stop="toggleVisualType(option)">
                    <ImageIcon class="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                </template>
              </div>

              <!-- Value cell -->
              <div class="p-3 hover:bg-gray-50/50 transition-colors cursor-text"
                   @click="startEditing(option, 'value')">
                <template v-if="editingId === option.id && editingCell === 'value'">
                  <input
                    type="text"
                    v-model="tempEditValue"
                    class="w-full outline-none border-none bg-transparent"
                    @blur="saveEdit(option)"
                    @keydown="handleKeyDown($event, option)"
                    ref="editInput"
                    autofocus
                  />
                </template>
                <span v-else class="text-[14px]" :class="{ 'text-gray-400': !option.value }">
                  {{ option.value || 'Value' }}
                </span>
              </div>

              <!-- Identifier cell -->
              <div class="p-3 hover:bg-gray-50/50 transition-colors cursor-text"
                   @click="startEditing(option, 'identifier')">
                <template v-if="editingId === option.id && editingCell === 'identifier'">
                  <input
                    type="text"
                    v-model="tempEditValue"
                    class="w-full outline-none border-none bg-transparent"
                    @blur="saveEdit(option)"
                    @keydown="handleKeyDown($event, option)"
                    ref="editInput"
                    autofocus
                  />
                </template>
                <span v-else class="text-[14px]" :class="{ 'text-gray-400': !option.identifier }">
                  {{ option.identifier || 'Identifier' }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Color Picker Sheet -->
    <Sheet v-model:open="showColorPicker">
      <SheetContent side="right" class="w-[400px]">
        <SheetHeader>
          <SheetTitle>Choose Color</SheetTitle>
          <SheetDescription>
            Select a color or enter a hex code
          </SheetDescription>
        </SheetHeader>
        <div class="grid gap-4 py-4">
          <div class="flex flex-col space-y-4">
            <input
              type="color"
              v-model="colorCode"
              class="w-full h-40 cursor-pointer"
            />
            <div class="space-y-2">
              <label class="text-sm font-medium">Color Code</label>
              <Input
                v-model="colorCode"
                placeholder="#000000"
              />
            </div>
          </div>
          <div class="flex justify-end space-x-2">
            <Button variant="outline" @click="showColorPicker = false">
              Cancel
            </Button>
            <Button @click="saveColor">
              Save
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Add Custom Attribute Sheet -->
    <Sheet v-model:open="showAddAttributeSheet">
      <SheetContent side="right" class="w-[400px]">
        <SheetHeader>
          <SheetTitle>Add Custom Attribute</SheetTitle>
          <SheetDescription>
            Create a new attribute with custom settings
          </SheetDescription>
        </SheetHeader>
        <div class="grid gap-4 py-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">Attribute Name</label>
            <Input
              v-model="newAttributeName"
              placeholder="e.g., Pattern, Style, Weight"
            />
          </div>
          
          <div class="space-y-2">
            <label class="text-sm font-medium">Visual Type</label>
            <Select v-model="newAttributeType">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="color">Color</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
            
            <p class="text-sm text-muted-foreground mt-2">
              <template v-if="newAttributeType === 'text'">
                Text will be displayed as letters or symbols
              </template>
              <template v-if="newAttributeType === 'color'">
                Colors will be shown as color swatches
              </template>
              <template v-if="newAttributeType === 'image'">
                Images can be uploaded for each option
              </template>
            </p>
          </div>

          <div class="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              @click="showAddAttributeSheet = false"
            >
              Cancel
            </Button>
            <Button 
              @click="addCustomAttribute"
              :disabled="!newAttributeName.trim()"
            >
              Add Attribute
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>

<style scoped>
.contents {
  display: contents;
}

/* Hide default color picker button */
input[type="color"] {
  -webkit-appearance: none;
  border: none;
  padding: 0;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type="color"]::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}
</style> 