<template>
  <div class="home-page">
    <!-- 顶部搜索栏（占位符） -->
    <div class="search-bar">
      <van-icon name="search" />
      <span class="search-placeholder">搜索商品（V2.0上线）</span>
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

    <!-- 排序和筛选区域 -->
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
      <div class="filter-btn" @click="showDormFilter = true">
        <van-icon name="filter-o" />
        <span>宿舍筛选</span>
      </div>
    </div>

    <!-- 商品列表 - 单列大卡片 -->
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
        <div class="card-list">
          <div
            v-for="item in items"
            :key="item.id"
            class="item-card"
            @click="goDetail(item.id)"
          >
            <!-- 左侧图片 -->
            <div class="card-image">
              <img :src="getItemImage(item)" :alt="item.title" />
              <div class="view-badge">
                <van-icon name="eye-o" size="12" />
                <span>{{ item.views || 0 }}</span>
              </div>
            </div>
            
            <!-- 右侧内容 -->
            <div class="card-content">
              <div class="card-header">
                <h3 class="card-title">{{ item.title }}</h3>
                <van-tag 
                  v-if="item.condition" 
                  :type="getConditionType(item.condition)" 
                  size="medium"
                >
                  {{ item.condition }}
                </van-tag>
              </div>
              
              <p class="card-desc text-ellipsis-2">
                {{ item.description || '暂无描述' }}
              </p>
              
              <div class="card-dorm" v-if="item.dormitory">
                <van-icon name="location-o" size="12" />
                <span>{{ item.dormitory }}</span>
              </div>
              
              <div class="card-footer">
                <span class="card-price">¥{{ item.price }}</span>
                <span class="card-category">{{ getCategoryName(item.category_id) }}</span>
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

    <!-- 宿舍筛选弹出层 -->
    <van-popup v-model:show="showDormFilter" position="bottom" round>
      <div class="dorm-filter-popup">
        <div class="popup-header">
          <span class="popup-title">选择宿舍区域</span>
          <span class="popup-clear" @click="clearDormFilter">清除</span>
        </div>
        <van-checkbox-group v-model="selectedDorms" class="dorm-checkbox-group">
          <van-checkbox 
            v-for="dorm in dormOptions" 
            :key="dorm" 
            :name="dorm"
            shape="square"
          >
            {{ dorm }}
          </van-checkbox>
        </van-checkbox-group>
        <div class="popup-actions">
          <van-button type="default" @click="showDormFilter = false">取消</van-button>
          <van-button type="primary" @click="applyDormFilter">确定</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getItemList, getCategoryList } from '@/api'

const router = useRouter()

// 状态
const activeTab = ref(0)
const categories = ref([{ id: 0, name: '全部' }])
const items = ref([])
const loading = ref(false)
const page = ref(1)
const total = ref(0)
const listRef = ref(null)

// 排序相关
const currentSort = ref('latest')
const sortOptions = [
  { label: '最新发布', value: 'latest' },
  { label: '最新商品', value: 'condition' },
  { label: '价格↑', value: 'price_asc' },
  { label: '价格↓', value: 'price_desc' }
]

// 宿舍筛选相关
const showDormFilter = ref(false)
const selectedDorms = ref([])
const appliedDorms = ref([])
const dormOptions = [
  '沁苑',
  '韵苑',
  '紫菘',
  '西十二',
  '东园',
  '南一',
  '南二'
]

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

// 获取商品图片
const getItemImage = (item) => {
  try {
    const urls = typeof item.image_urls === 'string' ? JSON.parse(item.image_urls) : item.image_urls
    if (urls && urls.length > 0) {
      return urls[0]
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
    categories.value = [{ id: 0, name: '全部' }, ...res.data]
  } catch (error) {
    console.error('获取分类失败:', error)
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
    }

    const params = {
      category_id: activeTab.value,
      page: page.value,
      limit: 10,
      sort: currentSort.value
    }
    
    // 添加宿舍筛选
    if (appliedDorms.value.length > 0) {
      params.dormitory = appliedDorms.value.join(',')
    }

    const res = await getItemList(params)

    if (reset) {
      items.value = res.data.items
    } else {
      items.value = [...items.value, ...res.data.items]
    }
    total.value = res.data.total
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

// 清除宿舍筛选
const clearDormFilter = () => {
  selectedDorms.value = []
}

// 应用宿舍筛选
const applyDormFilter = () => {
  appliedDorms.value = [...selectedDorms.value]
  showDormFilter.value = false
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

.search-placeholder {
  font-size: 14px;
}

/* 排序和筛选栏 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.sort-buttons {
  display: flex;
  gap: 8px;
}

.sort-btn {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  color: #666;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-btn.active {
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
}

/* 商品列表 */
.item-list {
  padding: 12px;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

/* 单列卡片列表 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 商品卡片 */
.item-card {
  display: flex;
  background-color: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.item-card:active {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

/* 左侧图片区 */
.card-image {
  width: 110px;
  height: 130px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.view-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
}

/* 右侧内容区 */
.card-content {
  flex: 1;
  padding: 12px 14px 12px 10px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-desc {
  font-size: 12px;
  color: #888;
  line-height: 1.4;
  margin: 0 0 6px 0;
}

.card-dorm {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.card-price {
  font-size: 18px;
  font-weight: bold;
  color: #ee0a24;
}

.card-category {
  font-size: 11px;
  color: #999;
  background: #f5f5f5;
  padding: 3px 8px;
  border-radius: 10px;
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
  width: 56px;
  height: 56px;
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

.publish-btn:active {
  transform: scale(0.95);
}

/* 宿舍筛选弹出层 */
.dorm-filter-popup {
  padding: 16px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.popup-clear {
  font-size: 14px;
  color: #1989fa;
  cursor: pointer;
}

.dorm-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.dorm-checkbox-group .van-checkbox {
  margin-right: 0;
}

.popup-actions {
  display: flex;
  gap: 12px;
}

.popup-actions .van-button {
  flex: 1;
}
</style>
