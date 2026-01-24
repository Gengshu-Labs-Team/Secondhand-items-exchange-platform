<template>
  <div class="home-page">
    <!-- 顶部搜索栏 -->
    <div class="search-bar">
      <van-icon name="search" />
      <input 
        v-model="searchKeyword"
        type="text"
        class="search-input"
        placeholder="搜索商品标题或描述"
        @input="onSearchInput"
        @keyup.enter="doSearch"
      />
      <van-icon 
        v-if="searchKeyword" 
        name="clear" 
        class="search-clear"
        @click="clearSearch"
      />
      <!-- 用户头像/登录按钮 -->
      <div class="user-avatar" @click="goProfile">
        <van-icon v-if="!isLoggedIn" name="user-circle-o" size="24" color="#667eea" />
        <div v-else class="avatar-circle">
          {{ userInitial }}
        </div>
      </div>
    </div>

    <!-- 搜索结果提示 -->
    <div v-if="searchKeyword || selectedDorms.length > 0" class="filter-result-bar">
      <div class="filter-tags">
        <span v-if="searchKeyword" class="filter-tag search-tag">
          🔍 "{{ searchKeyword }}"
          <van-icon name="cross" size="12" @click="clearSearch" />
        </span>
        <span v-for="dorm in selectedDorms" :key="dorm" class="filter-tag dorm-tag">
          🏠 {{ dorm }}
          <van-icon name="cross" size="12" @click="toggleDorm(dorm)" />
        </span>
      </div>
      <span class="filter-result-count">找到 {{ filteredTotal }} 件商品</span>
    </div>

    <!-- 分类 Tab -->
    <van-tabs v-model:active="activeTab" sticky swipeable @change="onTabChange">
      <van-tab
        v-for="category in displayCategories"
        :key="category.id"
        :title="category.name"
        :name="category.id"
      />
    </van-tabs>

    <!-- 排序区域 -->
    <div class="filter-bar">
      <div class="sort-buttons">
        <span 
          v-for="opt in sortOptions" 
          :key="opt.value"
          :class="['sort-btn', { active: currentSort === opt.value }]"
          @click="changeSort(opt.value)"
        >
          {{ opt.label }}
        </span>
      </div>
    </div>

    <!-- 宿舍筛选区域 -->
    <div class="dorm-filter-bar">
      <span class="dorm-filter-label">🏠</span>
      <div class="dorm-filter-options">
        <span 
          v-for="dorm in dormOptions" 
          :key="dorm"
          :class="['dorm-btn', { active: selectedDorms.includes(dorm) }]"
          @click="toggleDorm(dorm)"
        >
          {{ dorm }}
        </span>
        <span 
          v-if="selectedDorms.length > 0"
          class="dorm-btn clear-btn"
          @click="clearDormFilter"
        >
          清除筛选
        </span>
      </div>
    </div>

    <!-- 商品列表 - 双列瀑布流 -->
    <div class="item-list" ref="listRef">
      <template v-if="loading && items.length === 0">
        <div class="loading-container">
          <van-loading type="spinner" color="#1989fa">加载中...</van-loading>
        </div>
      </template>

      <template v-else-if="items.length === 0">
        <van-empty description="暂无商品" />
      </template>

      <template v-else>
        <div class="waterfall-container">
          <!-- 左列 -->
          <div class="waterfall-column">
            <div
              v-for="item in leftColumnItems"
              :key="item.id"
              class="item-card"
              @click="goDetail(item.id)"
            >
              <!-- 图片 -->
              <div class="card-image">
                <img :src="getItemImage(item)" :alt="item.title" @load="onImageLoad" />
                <div class="view-badge">
                  <van-icon name="eye-o" size="10" />
                  <span>{{ item.views || 0 }}</span>
                </div>
                <van-tag 
                  v-if="item.condition" 
                  :type="getConditionType(item.condition)" 
                  size="small"
                  class="condition-tag"
                >
                  {{ item.condition }}
                </van-tag>
              </div>
              
              <!-- 内容 -->
              <div class="card-content">
                <h3 class="card-title">{{ item.title }}</h3>
                
                <p class="card-desc" v-if="item.description">
                  {{ item.description }}
                </p>
                
                <div class="card-dorm" v-if="item.dorm_location || item.dormitory">
                  <van-icon name="location-o" size="11" />
                  <span>{{ item.dorm_location || item.dormitory }}</span>
                </div>
                
                <div class="card-footer">
                  <span class="card-price">¥{{ item.price }}</span>
                  <span class="card-category">{{ getCategoryName(item.category_id) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 右列 -->
          <div class="waterfall-column">
            <div
              v-for="item in rightColumnItems"
              :key="item.id"
              class="item-card"
              @click="goDetail(item.id)"
            >
              <!-- 图片 -->
              <div class="card-image">
                <img :src="getItemImage(item)" :alt="item.title" @load="onImageLoad" />
                <div class="view-badge">
                  <van-icon name="eye-o" size="10" />
                  <span>{{ item.views || 0 }}</span>
                </div>
                <van-tag 
                  v-if="item.condition" 
                  :type="getConditionType(item.condition)" 
                  size="small"
                  class="condition-tag"
                >
                  {{ item.condition }}
                </van-tag>
              </div>
              
              <!-- 内容 -->
              <div class="card-content">
                <h3 class="card-title">{{ item.title }}</h3>
                
                <p class="card-desc" v-if="item.description">
                  {{ item.description }}
                </p>
                
                <div class="card-dorm" v-if="item.dorm_location || item.dormitory">
                  <van-icon name="location-o" size="11" />
                  <span>{{ item.dorm_location || item.dormitory }}</span>
                </div>
                
                <div class="card-footer">
                  <span class="card-price">¥{{ item.price }}</span>
                  <span class="card-category">{{ getCategoryName(item.category_id) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="loading" class="load-more">
          <van-loading type="spinner" size="20">加载更多...</van-loading>
        </div>
        <div v-else-if="noMore" class="no-more">没有更多了</div>
      </template>
    </div>

    <!-- 发布按钮 -->
    <div class="publish-btn" @click="goPublish">
      <van-icon name="plus" size="24" color="#fff" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getItemList, getCategoryList } from '@/api'

const router = useRouter()

// 用户状态
const isLoggedIn = computed(() => !!localStorage.getItem('token'))
const currentUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    return {}
  }
})
const userInitial = computed(() => {
  const name = currentUser.value.username || ''
  return name.charAt(0).toUpperCase()
})

// 状态
const activeTab = ref(0)
const activeCategory = ref(0)  // 当前选中的分类
const categories = ref([{ id: 0, name: '全部' }])
const items = ref([])
const loading = ref(false)
const page = ref(1)
const total = ref(0)
const listRef = ref(null)

// 搜索相关
const searchKeyword = ref('')
const searchTimer = ref(null)
const filteredTotal = ref(0)

// 排序相关
const currentSort = ref('latest')
const sortOptions = [
  { label: '最新发布', value: 'latest' },
  { label: '最新商品', value: 'condition' },
  { label: '价格↑', value: 'price_asc' },
  { label: '价格↓', value: 'price_desc' }
]

// 宿舍筛选相关 - 只保留三个选项
const selectedDorms = ref([])
const dormOptions = ref(['紫菘', '沁苑', '韵苑'])

// 过滤掉重复的"全部"
const displayCategories = computed(() => {
  const seen = new Set()
  return categories.value.filter(cat => {
    const key = cat.id + '-' + cat.name
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

const noMore = computed(() => {
  return items.value.length >= total.value && items.value.length > 0
})

// 瀑布流：将商品分配到左右两列
const leftColumnItems = computed(() => {
  return items.value.filter((_, index) => index % 2 === 0)
})

const rightColumnItems = computed(() => {
  return items.value.filter((_, index) => index % 2 === 1)
})

// 图片加载完成回调（用于瀑布流重排，可选）
const onImageLoad = () => {
  // 图片加载完成后可以触发重排逻辑
}

// 获取商品图片 - 修复图片显示
const getItemImage = (item) => {
  try {
    const urls = typeof item.image_urls === 'string' ? JSON.parse(item.image_urls) : item.image_urls
    if (urls && urls.length > 0) {
      let imageUrl = urls[0]
      // 如果已经是完整URL（http开头），直接返回
      // 如果是相对路径（/uploads/...），直接使用（vite会代理到后端）
      return imageUrl
    }
  } catch (e) {
    console.error('解析图片失败:', e)
  }
  // 默认图片
  return 'https://img.yzcdn.cn/vant/cat.jpeg'
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  const cat = categories.value.find(c => c.id === categoryId)
  return cat ? cat.name : '其他'
}

// 获取商品状况对应的标签类型
const getConditionType = (condition) => {
  if (condition?.includes('全新') || condition?.includes('九五')) return 'success'
  if (condition?.includes('九成')) return 'primary'
  if (condition?.includes('八成')) return 'warning'
  return 'default'
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const res = await getCategoryList()
    console.log('Categories Response:', res)
    // 响应拦截器返回 response.data，所以 res = {success: true, data: [...]}
    // 由于拦截器检查了 success，这里 res 应该就是原始的 response.data
    // 所以分类数组在 res.data 中
    if (Array.isArray(res)) {
      // 如果res直接是数组（拦截器只返回了data部分）
      categories.value = res
    } else if (res.data && Array.isArray(res.data)) {
      // 如果res是完整对象
      categories.value = res.data
    } else {
      console.error('Unexpected categories format:', res)
      categories.value = [{ id: 0, name: '全部' }]
    }
  } catch (error) {
    console.error('获取分类失败:', error)
    categories.value = [{ id: 0, name: '全部' }]
  }
}

// 获取商品列表
const fetchItems = async (reset = false) => {
  if (loading.value) return
  if (!reset && noMore.value) return

  loading.value = true
  try {
    if (reset) {
      page.value = 1
      items.value = []
      noMore.value = false
    }
    
    const res = await getItemList({
      page: page.value,
      limit: 20,
      category_id: activeCategory.value === 0 ? undefined : activeCategory.value,
      sort_by: currentSort.value
    })
    
    console.log('Raw API Response:', res)
    
    // 响应拦截器返回 response.data，所以 res = {success: true, data: {items: [...], total: 17}}
    let filteredItems = res.data?.items || []
    
    // 宿舍模糊匹配
    if (selectedDorms.value.length > 0) {
      filteredItems = filteredItems.filter(item => {
        if (!item.dormitory) return false
        const dormStr = item.dormitory.toLowerCase()
        return selectedDorms.value.some(dorm => {
          const dormLower = dorm.toLowerCase()
          // 双向模糊匹配
          return dormStr.includes(dormLower) || dormLower.includes(dormStr)
        })
      })
    }
    
    // 搜索关键词匹配（标题和描述）
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim().toLowerCase()
      filteredItems = filteredItems.filter(item => {
        const title = (item.title || '').toLowerCase()
        const desc = (item.description || '').toLowerCase()
        return title.includes(keyword) || desc.includes(keyword)
      })
    }

    if (reset) {
      items.value = filteredItems
    } else {
      items.value = [...items.value, ...filteredItems]
    }
    
    console.log('Filtered items:', filteredItems)
    console.log('Items after update:', items.value)
    console.log('Items length:', items.value.length)
    
    total.value = res.data?.total || 0
    filteredTotal.value = items.value.length
    noMore.value = items.value.length >= (res.data?.total || 0)
    page.value++
  } catch (error) {
    console.error('获取商品列表失败:', error)
  } finally {
    loading.value = false
  }
}

// Tab 切换
const onTabChange = () => {
  fetchItems(true)
}

// 排序切换
const changeSort = (sort) => {
  if (currentSort.value !== sort) {
    currentSort.value = sort
    fetchItems(true)
  }
}

// 搜索输入防抖
const onSearchInput = () => {
  if (searchTimer.value) {
    clearTimeout(searchTimer.value)
  }
  searchTimer.value = setTimeout(() => {
    fetchItems(true)
  }, 300)
}

// 执行搜索
const doSearch = () => {
  if (searchTimer.value) {
    clearTimeout(searchTimer.value)
  }
  fetchItems(true)
}

// 清空搜索
const clearSearch = () => {
  searchKeyword.value = ''
  fetchItems(true)
}

// 切换宿舍选择
const toggleDorm = (dorm) => {
  const index = selectedDorms.value.indexOf(dorm)
  if (index > -1) {
    selectedDorms.value.splice(index, 1)
  } else {
    selectedDorms.value.push(dorm)
  }
  fetchItems(true)
}

// 清除宿舍筛选
const clearDormFilter = () => {
  selectedDorms.value = []
  fetchItems(true)
}

// 滚动加载更多
const handleScroll = () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  if (scrollTop + windowHeight >= documentHeight - 100) {
    fetchItems()
  }
}

// 跳转详情页
const goDetail = (id) => {
  router.push(`/detail/${id}`)
}

// 跳转发布页
const goPublish = () => {
  router.push('/publish')
}

// 跳转个人中心/登录页
const goProfile = () => {
  if (isLoggedIn.value) {
    router.push('/profile')
  } else {
    router.push('/login')
  }
}

// 生命周期
onMounted(() => {
  fetchCategories()
  fetchItems()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 80px;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px;
  padding: 10px 16px;
  background-color: #f5f5f5;
  border-radius: 20px;
  color: #999;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #333;
}

.search-input::placeholder {
  color: #999;
}

.search-clear {
  cursor: pointer;
  color: #999;
}

.search-clear:hover {
  color: #666;
}

/* 用户头像 */
.user-avatar {
  cursor: pointer;
  margin-left: 8px;
  flex-shrink: 0;
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

/* 筛选结果提示栏 */
.filter-result-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background: #f0f7ff;
  color: #1989fa;
}

.filter-tag .van-icon {
  cursor: pointer;
}

.filter-tag.dorm-tag {
  background: #e8f5e9;
  color: #4caf50;
}

.filter-result-count {
  font-size: 12px;
  color: #999;
}

.search-placeholder {
  font-size: 14px;
}

/* 排序和筛选栏 */
.filter-bar {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 10px 12px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.sort-buttons {
  display: flex;
  gap: 10px;
}

.sort-btn {
  font-size: 14px;
  padding: 6px 14px;
  border-radius: 16px;
  color: #666;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.sort-btn.active {
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 宿舍筛选栏 */
.dorm-filter-bar {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #fff;
  border-bottom: 1px solid #eee;
  gap: 10px;
  flex-wrap: wrap;
}

.dorm-filter-label {
  font-size: 16px;
  flex-shrink: 0;
}

.dorm-filter-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.dorm-btn {
  font-size: 14px;
  padding: 6px 16px;
  border-radius: 16px;
  color: #666;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  font-weight: 500;
}

.dorm-btn:hover:not(.active) {
  background: #eeeeee;
  color: #333;
}

.dorm-btn.active {
  color: #fff;
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
  border-color: #4caf50;
}

.dorm-btn.active:hover {
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
}

.dorm-btn.clear-btn {
  color: #ff6b6b;
  background: #fff5f5;
  border: 1px solid #ffcdd2;
}

.dorm-btn.clear-btn:hover {
  background: #ffebee;
  color: #d32f2f;
}

/* 商品列表 */
.item-list {
  padding: 8px;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

/* 瀑布流容器 */
.waterfall-container {
  display: flex;
  gap: 8px;
}

.waterfall-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 商品卡片 - 瀑布流样式 */
.item-card {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  cursor: pointer;
}

.item-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* 图片区域 - 自适应高度 */
.card-image {
  width: 100%;
  position: relative;
  overflow: hidden;
  background: #f5f5f5;
}

.card-image img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: cover;
}

.view-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
}

.condition-tag {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 10px !important;
  padding: 2px 6px !important;
  line-height: 1.2 !important;
  white-space: nowrap;
}

/* 内容区域 */
.card-content {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-desc {
  font-size: 12px;
  color: #888;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-dorm {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #999;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.card-price {
  font-size: 16px;
  font-weight: bold;
  color: #ee0a24;
}

.card-category {
  font-size: 11px;
  color: #999;
  background: #f5f5f5;
  padding: 3px 10px;
  border-radius: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

/* 加载更多 */
.load-more,
.no-more {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 14px;
}

/* 发布按钮 */
.publish-btn {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  z-index: 100;
  cursor: pointer;
  transition: transform 0.2s;
}

.publish-btn .van-icon {
  font-size: 24px !important;
}

.publish-btn:active {
  transform: scale(0.95);
}

/* 手机端适配 */
@media screen and (max-width: 768px) {
  .search-bar {
    margin: 10px;
    padding: 8px 12px;
    border-radius: 18px;
  }
  
  .search-input {
    font-size: 14px;
  }
  
  .avatar-circle {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  
  .user-avatar .van-icon {
    font-size: 20px !important;
  }
  
  /* Tab栏调整 - 修复文字被遮挡 */
  :deep(.van-tabs__nav) {
    padding: 8px 10px;
  }
  
  :deep(.van-tab) {
    font-size: 14px;
    padding: 0 8px;
    line-height: 1.5;
  }
  
  :deep(.van-tabs__line) {
    bottom: 8px;
  }
  
  /* 筛选栏优化 */
  .filter-bar {
    padding: 8px 10px;
  }
  
  .sort-btn {
    font-size: 13px !important;
    padding: 5px 10px !important;
    border-radius: 14px;
  }
  
  .dorm-filter-bar {
    padding: 8px 10px;
    gap: 8px;
  }
  
  .dorm-btn {
    font-size: 13px !important;
    padding: 5px 10px !important;
    border-radius: 14px;
  }
  
  .dorm-filter-label {
    font-size: 14px;
  }
  
  /* 筛选结果栏 */
  .filter-result-bar {
    padding: 6px 10px;
  }
  
  .filter-tag {
    font-size: 11px;
    padding: 3px 6px;
  }
  
  .filter-result-count {
    font-size: 11px;
  }
  
  /* 商品列表 */
  .item-list {
    padding: 6px;
  }
  
  .waterfall-container {
    gap: 6px;
  }
  
  .waterfall-column {
    gap: 6px;
  }
  
  /* 商品卡片 */
  .item-card {
    border-radius: 10px;
  }
  
  .card-content {
    padding: 8px;
    gap: 4px;
  }
  
  .card-title {
    font-size: 13px;
    line-height: 1.3;
  }
  
  .card-desc {
    font-size: 11px;
    line-height: 1.4;
    -webkit-line-clamp: 2;
  }
  
  .card-dorm {
    font-size: 10px;
  }
  
  .card-dorm .van-icon {
    font-size: 10px;
  }
  
  .card-footer {
    margin-top: 3px;
  }
  
  .card-price {
    font-size: 15px;
  }
  
  .card-category {
    font-size: 10px;
    padding: 2px 8px;
    max-width: 70px;
  }
  
  .view-badge {
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 6px;
  }
  
  .condition-tag {
    font-size: 9px !important;
    padding: 2px 5px !important;
    line-height: 1.2 !important;
  }
  
  /* 发布按钮 */
  .publish-btn {
    width: 56px;
    height: 56px;
    right: 16px;
    bottom: 70px;
  }
  
  .publish-btn .van-icon {
    font-size: 24px !important;
    padding: 6px 12px !important;
  }
}
/* 修复分类Tab文字被遮挡 */
:deep(.van-tab) {
  padding: 12px 8px;
  overflow: visible;
}

:deep(.van-tab__text) {
  overflow: visible;
  line-height: 1.5;
}

:deep(.van-tabs__wrap) {
  height: auto;
  overflow: visible;
}

:deep(.van-tabs__nav) {
  padding-bottom: 12px;
}
</style>
