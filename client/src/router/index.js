import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '校园二手交易' }
  },
  {
    path: '/detail/:id',
    name: 'Detail',
    component: () => import('@/views/Detail.vue'),
    meta: { title: '商品详情' }
  },
  {
    path: '/publish',
    name: 'Publish',
    component: () => import('@/views/Publish.vue'),
    meta: { title: '发布商品' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
    meta: { title: '商品管理后台' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '校园二手交易'
  next()
})

export default router
