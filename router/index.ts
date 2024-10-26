import { createRouter, createWebHistory } from 'vue-router'
import Products from '@/pages/products.vue'

const routes = [
  // ... other routes
  {
    path: '/products',
    name: 'Products',
    component: Products
  },
  // ... other routes
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
