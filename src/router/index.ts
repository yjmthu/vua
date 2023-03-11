import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/scan',
    name: 'scan',
    component: () => import('@/components/CodeScan.vue')
  }
]

const router = createRouter({
  history: createWebHistory('/vua/'),
  // history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
