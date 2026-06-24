import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import env from '@/utils/env'

const AboutView = () => import('../views/AboutView.vue')
const ExampleView = () => import('../views/ExampleView.vue')
const EditorView = () => import('../views/editor/index.vue')

const router = createRouter({
  history: createWebHistory(env.VITE_BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      // component: HomeView,
      component: EditorView,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    {
      path: '/example',
      name: 'example',
      component: ExampleView,
    },
    {
      path: '/editor',
      name: 'editor',
      component: EditorView,
    },
  ],
})

export default router
