<template>
  <div class="p-6">
    <div class="flex flex-col justify-between gap-5 md:flex-row md:items-center mb-4">
      <input type="search" v-model="search" placeholder="Search" class="w-full md:w-96 p-2 border rounded" />
    </div>

    <table class="w-full mt-5 rounded-md border">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.accessorKey" class="p-2 text-left bg-white font-semibold">
            {{ column.header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredData" :key="item.id" class="border-t">
          <td v-for="column in columns" :key="column.accessorKey" class="p-2">
            {{ item[column.accessorKey] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const search = ref("")

interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
}

const products = ref<Product[]>([]);
const error = ref<string | null>(null);

const columns = [
  { accessorKey: "sku", header: "SKU" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "stock", header: "Stock" },
];

const filteredData = computed(() => {
  if (!search.value) return products.value
  return products.value.filter(item => 
    Object.values(item).some(val => 
      val.toString().toLowerCase().includes(search.value.toLowerCase())
    )
  )
})

const fetchProducts = async () => {
  const url = "https://commerce-tarframework.turso.io/v2/pipeline";
  const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Mjk2NzQwNjQsImlkIjoiN2ZiNTFhMTgtYjU1My00Y2M2LTkwZWItZDE0ZTcxNDI5ODlhIn0.zxIjODPlBzNcAgQQ70xZj2sI7j7RSAHpYPQUtvyoAHDb4nLGzHAPiVvnJ6qeK7-00F8A6Lz__CSPjdITPZ31BQ";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          { type: "execute", stmt: { sql: "SELECT * FROM Instances" } },
          { type: "close" },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.results && data.results[0] && data.results[0].response && data.results[0].response.result && data.results[0].response.result.rows) {
      products.value = data.results[0].response.result.rows.map((row: any[]) => ({
        id: parseInt(row[0].value) || 0,
        sku: row[1].value || 'Unknown',
        name: row[2].value || 'Unknown',
        stock: parseInt(row[14].value) || 0,
      }));
    } else {
      throw new Error('Unexpected API response structure');
    }
  } catch (e) {
    console.error('Error fetching products:', e);
    error.value = e instanceof Error ? e.message : 'An unknown error occurred';
  }
}

onMounted(fetchProducts);
</script>
