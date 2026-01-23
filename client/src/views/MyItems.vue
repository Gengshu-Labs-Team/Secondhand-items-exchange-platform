<template>
  <div class="my-items-page">
    <van-nav-bar
      title="我的发布"
      left-arrow
      @click-left="$router.back()"
    />
    
    <div class="items-content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="loadMore"
        >
          <div v-if="items.length === 0 && !loading" class="empty-state">
            <van-empty description="还没有发布商品">
              <van-button type="primary" round to="/publish">去发布</van-button>
            </van-empty>
          </div>
          
          <div v-else class="items-list">
            <div
              v-for="item in items"
              :key="item.id"
              class="item-card"
              @click="goDetail(item.id)"
            >
              <div class="item-image">
                <img :src="getImageUrl(item.cover_image)" :alt="item.title" />
                <van-tag
                  :type="item.status === 1 ? 'success' : 'default'"
                  class="status-tag"
                >
                  {{ item.status === 1 ? '上架中' : '已下架' }}
                </van-tag>
              </div>
              <div class="item-info">
                <h3 class="item-title">{{ item.title }}</h3>
                <p class="item-meta">
                  <span class="condition">{{ item.condition }}</span>
                  <span class="location">{{ item.dormitory }}</span>
                </p>
                <div class="item-bottom">
                  <span class="price">¥{{ item.price }}</span>
                  <span class="views">{{ item.views }} 浏览</span>
                </div>
                <div class="item-actions" @click.stop>
                  <van-button 
                    v-if="item.status === 1" 
                    size="small" 
                    type="danger"
                    @click="deleteItem(item)"
                  >
                    下架
                  </van-button>
                </div>
              </div>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 发布按钮 -->
    <div class="fab-button" @click="$router.push('/publish')">
      <van-icon name="plus" size="24" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showFailToast, showConfirmDialog } from 'vant'
import request from '../api/request'

const router = useRouter()

const items = ref([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pageSize = 10

onMounted(() => {
  loadItems()
})

const loadItems = async () => {
  try {
    const res = await request.get('/items/my', {
      params: { page: page.value, limit: pageSize }
    })
    if (res.success) {
      if (page.value === 1) {
        items.value = res.data.items
      } else {
        items.value.push(...res.data.items)
      }
      finished.value = items.value.length >= res.data.total
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const loadMore = () => {
  page.value++
  loadItems()
}

const onRefresh = () => {
  page.value = 1
  finished.value = false
  loadItems()
}

const goDetail = (id) => {
  router.push(`/detail/${id}`)
}

const getImageUrl = (url) => {
  if (!url) return 'https://via.placeholder.com/200x200?text=No+Image'
  if (url.startsWith('http')) return url
  return url
}

const deleteItem = async (item) => {
  try {
    await showConfirmDialog({
      title: '确认下架',
      message: `确定要下架「${item.title}」吗？`
    })
    
    const res = await request.delete(`/items/${item.id}`)
    if (res.success) {
      showSuccessToast('已下架')
      item.status = 0
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('下架失败:', error)
    }
  }
}
</script>

<style scoped>
.my-items-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.items-content {
  padding: 12px;
  padding-bottom: 80px;
}

.empty-state {
  padding: 60px 20px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.item-image {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  position: relative;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-tag {
  position: absolute;
  top: 8px;
  left: 8px;
}

.item-info {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.item-meta .condition {
  margin-right: 8px;
}

.item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.price {
  font-size: 18px;
  font-weight: 600;
  color: #ff4d4f;
}

.views {
  font-size: 12px;
  color: #999;
}

.item-actions {
  margin-top: auto;
}

.fab-button {
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
  color: #fff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  z-index: 100;
}
</style>
