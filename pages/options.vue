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
import AppHeader from '@/components/AppHeader.vue'

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
    <AppHeader />
    <div class="flex-1 p-8">
      <!-- Add attribute button -->
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-4">
          <Select v-model="selectedAttribute">
            <SelectTrigger class="w-[180px]">
              <SelectValue placeholder="Select attribute" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in attributeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" @click="showAddAttributeSheet = true">
            <Plus class="h-4 w-4 mr-2" />
            Add Attribute
          </Button>
        </div>
        <div class="relative w-full max-w-sm">
          <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="optionSearchQuery"
            placeholder="Search options..."
            class="pl-8"
          />
        </div>
      </div>

      <!-- Options table -->
      <div class="rounded-md border">
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="h-12 px-4 text-left align-middle font-medium">Visual</th>
              <th class="h-12 px-4 text-left align-middle font-medium">Value</th>
              <th class="h-12 px-4 text-left align-middle font-medium">Identifier</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="option in filteredValues" :key="option.id" class="border-b">
              <!-- Visual cell -->
              <td class="p-4">
                <div class="flex items-center gap-2">
                  <div v-if="option.type === 'color'" 
                    class="h-6 w-6 rounded cursor-pointer"
                    :style="{ backgroundColor: option.visual }"
                    @click="openColorPicker(option)"
                  ></div>
                  <div v-else class="cursor-pointer" @click="openColorPicker(option)">
                    {{ option.visual }}
                  </div>
                  <Button variant="ghost" size="icon" @click="toggleVisualType(option)" v-if="option.attribute !== 'color'">
                    <ImageIcon v-if="option.type === 'text'" class="h-4 w-4" />
                    <span v-else class="text-sm">Aa</span>
                  </Button>
                </div>
              </td>
              
              <!-- Value cell -->
              <td class="p-4">
                <div v-if="editingId === option.id && editingCell === 'value'" class="flex items-center gap-2">
                  <Input
                    v-model="tempEditValue"
                    class="h-8"
                    @keydown="handleKeyDown($event, option)"
                    @blur="saveEdit(option)"
                  />
                </div>
                <div v-else class="cursor-pointer" @click="startEditing(option, 'value')">
                  {{ option.value }}
                </div>
              </td>
              
              <!-- Identifier cell -->
              <td class="p-4">
                <div v-if="editingId === option.id && editingCell === 'identifier'" class="flex items-center gap-2">
                  <Input
                    v-model="tempEditValue"
                    class="h-8"
                    @keydown="handleKeyDown($event, option)"
                    @blur="saveEdit(option)"
                  />
                </div>
                <div v-else class="cursor-pointer" @click="startEditing(option, 'identifier')">
                  {{ option.identifier }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add row button -->
      <Button variant="outline" class="mt-4" @click="addNewRow">
        <Plus class="h-4 w-4 mr-2" />
        Add Row
      </Button>

      <!-- Color picker sheet -->
      <Sheet v-model:open="showColorPicker">
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Choose Color</SheetTitle>
            <SheetDescription>
              Select a color for this option
            </SheetDescription>
          </SheetHeader>
          <div class="grid gap-4 py-4">
            <input
              type="color"
              v-model="colorCode"
              class="w-full h-40"
            />
            <Button @click="saveColor">Save Color</Button>
          </div>
        </SheetContent>
      </Sheet>

      <!-- Add attribute sheet -->
      <Sheet v-model:open="showAddAttributeSheet">
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add New Attribute</SheetTitle>
            <SheetDescription>
              Create a new attribute for your products
            </SheetDescription>
          </SheetHeader>
          <div class="grid gap-4 py-4">
            <div class="grid gap-2">
              <Input
                v-model="newAttributeName"
                placeholder="Attribute name"
              />
              <Select v-model="newAttributeType">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="color">Color</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button @click="addCustomAttribute">Add Attribute</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
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