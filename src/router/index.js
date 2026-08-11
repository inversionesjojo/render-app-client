import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ProjectPortal from '../views/ProjectPortal.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/p/:slug',
    name: 'ProjectPortal',
    component: ProjectPortal,
    props: true
  },
  // Catch all redirect to home
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
