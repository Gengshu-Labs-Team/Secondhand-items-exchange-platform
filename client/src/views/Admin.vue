<template>
  <div class="admin-page">
    <!-- 顶部导航 -->
    <van-nav-bar title="商品管理后台" left-arrow @click-left="goBack">
      <template #right>
        <van-icon name="refresh" size="20" @click="fetchItems" />
      </template>
    </van-nav-bar>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">全部商品</div>
      </div>
      <div class="stat-card active">
        <div class="stat-value">{{ stats.online }}</div>
        <div class="stat-label">展示中</div>
      </div>
      <div class="stat-card offline">
        <div class="stat-value">{{ stats.offline }}</div>
        <div class="stat-label">已下架</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <van-dropdown-menu>
        <van-dropdown-item v-model="filter.status" :options="statusOptions" @change="fetchItems" />
        <van-dropdown-item v-model="filter.category" :options="categoryOptions" @change="fetchItems" />
      </van-dropdown-menu>
    </div>

    <!-- 商品列表 -->
    <div class="item-list">
      <van-loading v-if="loading" class="loading">加载中...</van-loading>
      
      <van-empty v-else-if="items.length === 0" description="暂无商品数据" />
      
      <template v-else>
        <div class="item-table">
          <!-- 表头 -->
          <div class="table-header">
            <span class="col-id">ID</span>
            <span class="col-image">图片</span>
            <span class="col-title">标题</span>
            <span class="col-price">价格</span>
            <span class="col-category">分类</span>
            <span class="col-status">状态</span>
            <span class="col-time">发布时间</span>
            <span class="col-action">操作</span>
          </div>
          
          <!-- 表格行 -->
          <div 
            v-for="item in items" 
            :key="item.id" 
            class="table-row"
            :class="{ offline: item.status === 0 }"
          >
            <span class="col-id">{{ item.id }}</span>
            <span class="col-image">
              <van-image 
                :src="getFirstImage(item.image_urls)" 
                width="40" 
                height="40" 
                fit="cover"
                radius="4"
              />
            </span>
            <span class="col-title text-ellipsis" :title="item.title">{{ item.title }}</span>
            <span class="col-price price">{{ item.price }}</span>
            <span class="col-category">
              <van-tag size="small">{{ getCategoryName(item.category_id) }}</van-tag>
            </span>
            <span class="col-status">
              <van-tag :type="item.status === 1 ? 'success' : 'default'" size="small">
                {{ item.status === 1 ? '展示中' : '已下架' }}
              </van-tag>
            </span>
            <span class="col-time">{{ formatDate(item.created_at) }}</span>
            <span class="col-action">
              <van-button 
                v-if="item.status === 1"
                size="mini" 
                type="warning"
                @click="handleOffline(item)"
              >
                下架
              </van-button>
              <van-button 
                v-else
                size="mini" 
                type="success"
                @click="handleOnline(item)"
              >
                上架
              </van-button>
              <van-button 
                size="mini" 
                type="danger"
                @click="handleDelete(item)"
              >
                删除
              </van-button>
            </span>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination">
          <van-pagination 
            v-model="page" 
            :total-items="total" 
            :items-per-page="limit"
            :show-page-size="3"
            @change="fetchItems"
          />
        </div>
      </template>
    </div>

    <!-- 密码验证弹窗 -->
    <van-dialog
      v-model:show="showPasswordDialog"
      title="管理员验证"
      show-cancel-button
      @confirm="confirmAction"
    >
      <van-field
        v-model="adminPassword"
        type="password"
        placeholder="请输入管理员密码"
        class="password-input"
      />
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import request from '@/api/request'

const router = useRouter()

// 状态
const loading = ref(false)
const items = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(10)
const categories = ref([])

// 筛选
const filter = reactive({
  status: 'all',
  category: 0
})

const statusOptions = [
  { text: '全部状态', value: 'all' },
  { text: '展示中', value: 1 },
  { text: '已下架', value: 0 }
]

const categoryOptions = computed(() => {
  return [
    { text: '全部分类', value: 0 },
    ...categories.value.filter(c => c.id !== 0).map(c => ({
      text: c.name,
      value: c.id
    }))
  ]
})

// 统计
const stats = computed(() => {
  return {
    total: total.value,
    online: items.value.filter(i => i.status === 1).length,
    offline: items.value.filter(i => i.status === 0).length
  }
})

// 密码验证
const showPasswordDialog = ref(false)
const adminPassword = ref('')
const pendingAction = ref(null)

// 获取商品列表
const fetchItems = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      limit: limit.value,
      admin: true // 标记为管理员请求，获取所有状态的商品
    }
    if (filter.status !== 'all') {
      params.status = filter.status
    }
    if (filter.category !== 0) {
      params.category_id = filter.category
    }
    
    const res = await request.get('/items/admin', { params })
    items.value = res.data.items
    total.value = res.data.total
  } catch (error) {
    console.error('获取商品列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取分类
const fetchCategories = async () => {
  try {
    const res = await request.get('/categories')
    categories.value = res.data
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 获取第一张图片
const getFirstImage = (imageUrls) => {
  if (!imageUrls) return ''
  try {
    const urls = typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls
    return urls[0] || ''
  } catch {
    return ''
  }
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  const cat = categories.value.find(c => c.id === categoryId)
  return cat ? cat.name : '未知'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 返回
const goBack = () => {
  router.push('/')
}

// 下架商品
const handleOffline = (item) => {
  pendingAction.value = { type: 'offline', item }
  adminPassword.value = ''
  showPasswordDialog.value = true
}

// 上架商品
const handleOnline = (item) => {
  pendingAction.value = { type: 'online', item }
  adminPassword.value = ''
  showPasswordDialog.value = true
}

// 删除商品
const handleDelete = async (item) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要永久删除「${item.title}」吗？此操作不可恢复。`
    })
    pendingAction.value = { type: 'delete', item }
    adminPassword.value = ''
    showPasswordDialog.value = true
  } catch {
    // 取消
  }
}

// 确认操作
const confirmAction = async () => {
  if (!adminPassword.value) {
    showToast('请输入管理员密码')
    return
  }
  
  const { type, item } = pendingAction.value
  
  try {
    if (type === 'offline') {
      await request.put(`/items/${item.id}/status`, {
        status: 0,
        admin_password: adminPassword.value
      })
      showSuccessToast('已下架')
    } else if (type === 'online') {
      await request.put(`/items/${item.id}/status`, {
        status: 1,
        admin_password: adminPassword.value
      })
      showSuccessToast('已上架')
    } else if (type === 'delete') {
      await request.delete(`/items/${item.id}/force`, {
        data: { admin_password: adminPassword.value }
      })
      showSuccessToast('已删除')
    }
    
    fetchItems()
  } catch (error) {
    // 错误已在拦截器处理
  }
  
  pendingAction.value = null
}

// 生命周期
onMounted(() => {
  fetchCategories()
  fetchItems()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 统计卡片 */
.stats-cards {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  color: #fff;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 4px;
}

/* 筛选栏 */
.filter-bar {
  background: #fff;
}

/* 商品列表 */
.item-list {
  padding: 12px;
}

.loading {
  text-align: center;
  padding: 40px;
}

/* 表格样式 */
.item-table {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: flex;
  align-items: center;
  padding: 12px 8px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
}

.table-header {
  background: #fafafa;
  font-weight: 500;
  color: #666;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row.offline {
  background: #f9f9f9;
  opacity: 0.7;
}

.col-id { width: 40px; text-align: center; }
.col-image { width: 50px; }
.col-title { flex: 1; min-width: 0; padding: 0 8px; }
.col-price { width: 60px; text-align: right; }
.col-category { width: 70px; text-align: center; }
.col-status { width: 60px; text-align: center; }
.col-time { width: 90px; text-align: center; color: #999; }
.col-action { width: 100px; display: flex; gap: 4px; justify-content: center; }

/* 分页 */
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

/* 密码输入 */
.password-input {
  margin: 16px;
}

/* 响应式 */
@media (max-width: 600px) {
  .col-time {
    display: none;
  }
  .col-action {
    flex-direction: column;
    width: 50px;
  }
}
</style>
