<template>
  <div class="detail-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="商品详情"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    />

    <template v-if="loading">
      <div class="loading-container">
        <van-loading type="spinner" color="#1989fa">加载中...</van-loading>
      </div>
    </template>

    <template v-else-if="!item">
      <van-empty description="商品不存在或已下架" />
    </template>

    <template v-else>
      <!-- 图片轮播 -->
      <van-swipe class="image-swipe" :autoplay="3000" indicator-color="#1989fa">
        <van-swipe-item v-for="(img, index) in item.image_urls" :key="index">
          <van-image
            :src="img"
            fit="cover"
            class="swipe-image"
            @click="previewImage(index)"
          >
            <template #loading>
              <van-loading type="spinner" size="20" />
            </template>
          </van-image>
        </van-swipe-item>
      </van-swipe>

      <!-- 商品信息 -->
      <div class="item-info">
        <div class="price-row">
          <span class="price">{{ item.price }}</span>
          <van-tag v-if="item.condition" type="primary">{{ item.condition }}</van-tag>
        </div>
        <h1 class="item-title">{{ item.title }}</h1>
        <div class="item-meta">
          <span>发布于 {{ formatDate(item.created_at) }}</span>
          <span class="meta-divider">|</span>
          <span><van-icon name="eye-o" /> {{ item.views || 0 }} 次浏览</span>
        </div>
        <div class="item-dorm" v-if="item.dormitory">
          <van-icon name="location-o" />
          <span>{{ item.dormitory }}</span>
        </div>
      </div>

      <!-- 商品描述 -->
      <div class="item-desc">
        <h3>商品描述</h3>
        <p>{{ item.description || '卖家很懒，什么都没写~' }}</p>
      </div>

      <!-- 删除入口（隐藏） -->
      <div class="delete-entry" @click="showDeleteSheet = true">
        <van-icon name="setting-o" />
        <span>管理商品</span>
      </div>

      <!-- 底部操作栏 -->
      <div class="bottom-bar safe-area-bottom">
        <van-button type="primary" block round @click="showContact">
          <van-icon name="chat-o" style="margin-right: 4px;" />
          我想要 / 联系卖家
        </van-button>
      </div>

      <!-- 联系方式弹窗 -->
      <van-popup v-model:show="showContactPopup" round position="bottom">
        <div class="contact-popup">
          <h3>卖家联系方式</h3>
          <div class="contact-info">
            <span>{{ item.contact_info }}</span>
            <van-button size="small" type="primary" @click="copyContact">
              复制
            </van-button>
          </div>
          <p class="contact-tip">请添加卖家后协商交易细节，建议校内面交~</p>
        </div>
      </van-popup>

      <!-- 删除操作表 -->
      <van-action-sheet
        v-model:show="showDeleteSheet"
        :actions="deleteActions"
        cancel-text="取消"
        @select="onDeleteSelect"
      />

      <!-- 删除密码弹窗 -->
      <van-popup v-model:show="showDeletePopup" round>
        <div class="delete-popup">
          <h3>删除商品</h3>
          <p>请输入发布时设置的管理密码</p>
          <van-field
            v-model="deletePassword"
            type="password"
            placeholder="请输入管理密码"
            maxlength="6"
          />
          <div class="delete-btns">
            <van-button @click="showDeletePopup = false">取消</van-button>
            <van-button type="danger" @click="confirmDelete">确认删除</van-button>
          </div>
        </div>
      </van-popup>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showImagePreview, showSuccessToast } from 'vant'
import { getItemDetail, deleteItem } from '@/api'

const route = useRoute()
const router = useRouter()

// 状态
const item = ref(null)
const loading = ref(true)
const showContactPopup = ref(false)
const showDeleteSheet = ref(false)
const showDeletePopup = ref(false)
const deletePassword = ref('')

const deleteActions = [
  { name: '删除商品', color: '#ee0a24' }
]

// 获取商品详情
const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getItemDetail(route.params.id)
    item.value = res.data
  } catch (error) {
    console.error('获取商品详情失败:', error)
    item.value = null
  } finally {
    loading.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

// 图片预览
const previewImage = (index) => {
  showImagePreview({
    images: item.value.image_urls,
    startPosition: index
  })
}

// 显示联系方式
const showContact = () => {
  showContactPopup.value = true
}

// 复制联系方式
const copyContact = async () => {
  try {
    await navigator.clipboard.writeText(item.value.contact_info)
    showSuccessToast('已复制')
  } catch {
    // 降级方案
    const input = document.createElement('input')
    input.value = item.value.contact_info
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    showSuccessToast('已复制')
  }
}

// 删除操作
const onDeleteSelect = () => {
  showDeleteSheet.value = false
  showDeletePopup.value = true
  deletePassword.value = ''
}

// 确认删除
const confirmDelete = async () => {
  if (!deletePassword.value) {
    showToast('请输入管理密码')
    return
  }
  
  try {
    await deleteItem(route.params.id, deletePassword.value)
    showSuccessToast('删除成功')
    showDeletePopup.value = false
    router.replace('/')
  } catch (error) {
    // 错误已在拦截器处理
  }
}

// 生命周期
onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 80px;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 100px 0;
}

/* 图片轮播 */
.image-swipe {
  background-color: #fff;
}

.swipe-image {
  width: 100%;
  aspect-ratio: 4/3;
}

/* 商品信息 */
.item-info {
  background-color: #fff;
  padding: 16px;
  margin-bottom: 12px;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-row .price {
  font-size: 24px;
}

.item-title {
  font-size: 18px;
  font-weight: normal;
  color: #333;
  margin: 12px 0 8px;
  line-height: 1.4;
}

.item-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-divider {
  margin: 0 4px;
  color: #ddd;
}

.item-dorm {
  margin-top: 10px;
  padding: 8px 12px;
  background: #f7f8fa;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 商品描述 */
.item-desc {
  background-color: #fff;
  padding: 16px;
  margin-bottom: 12px;
}

.item-desc h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
}

.item-desc p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* 删除入口 */
.delete-entry {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 16px;
  color: #999;
  font-size: 14px;
  cursor: pointer;
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 16px;
  background-color: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

/* 联系方式弹窗 */
.contact-popup {
  padding: 24px;
  text-align: center;
}

.contact-popup h3 {
  font-size: 18px;
  margin-bottom: 16px;
}

.contact-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background-color: #f7f8fa;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 500;
}

.contact-tip {
  margin-top: 16px;
  font-size: 12px;
  color: #999;
}

/* 删除弹窗 */
.delete-popup {
  padding: 24px;
  width: 300px;
}

.delete-popup h3 {
  font-size: 18px;
  text-align: center;
  margin-bottom: 8px;
}

.delete-popup p {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
}

.delete-btns {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.delete-btns .van-button {
  flex: 1;
}
</style>
