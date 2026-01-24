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

      <!-- 管理入口（仅发布者或管理员可见） -->
      <div v-if="item.canEdit || item.canDelete" class="delete-entry" @click="showManageSheet = true">
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

      <!-- 管理操作表 -->
      <van-action-sheet
        v-model:show="showManageSheet"
        :actions="manageActions"
        cancel-text="取消"
        @select="onManageSelect"
      />

      <!-- 修改商品弹窗 -->
      <van-popup v-model:show="showEditPopup" round position="bottom" :style="{ height: '80%' }">
        <div class="edit-popup">
          <div class="edit-header">
            <span @click="showEditPopup = false">取消</span>
            <h3>修改商品信息</h3>
            <span class="save-btn" @click="saveEdit">保存</span>
          </div>
          <div class="edit-form">
            <van-field v-model="editForm.title" label="标题" placeholder="请输入商品标题" maxlength="50" />
            <van-field v-model="editForm.price" label="价格" type="number" placeholder="请输入价格" />
            <van-field v-model="editForm.condition" label="新旧程度" readonly is-link @click="showConditionPicker = true" />
            <van-field v-model="editForm.description" label="描述" type="textarea" placeholder="请输入商品描述" rows="4" autosize />
          </div>
        </div>
      </van-popup>

      <!-- 新旧程度选择器 -->
      <van-popup v-model:show="showConditionPicker" position="bottom" round>
        <van-picker
          :columns="conditionColumns"
          @confirm="onConditionConfirm"
          @cancel="showConditionPicker = false"
        />
      </van-popup>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showImagePreview, showSuccessToast, showConfirmDialog } from 'vant'
import { getItemDetail, deleteItem, updateItem } from '@/api'

const route = useRoute()
const router = useRouter()

// 状态
const item = ref(null)
const loading = ref(true)
const showContactPopup = ref(false)
const showManageSheet = ref(false)
const showEditPopup = ref(false)
const showConditionPicker = ref(false)

// 修改表单
const editForm = ref({
  title: '',
  price: '',
  condition: '',
  description: ''
})

const conditionColumns = [
  { text: '全新', value: '全新' },
  { text: '九五新', value: '九五新' },
  { text: '九成新', value: '九成新' },
  { text: '八成新', value: '八成新' },
  { text: '七成新及以下', value: '七成新及以下' }
]

// 管理操作
const manageActions = computed(() => {
  const actions = []
  if (item.value?.canEdit) {
    actions.push({ name: '修改商品信息', value: 'edit' })
  }
  if (item.value?.canDelete) {
    actions.push({ name: '删除商品', value: 'delete', color: '#ee0a24' })
  }
  return actions
})

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
    startPosition: index,
    closeable: true,
    closeIcon: 'cross',
    closeIconPosition: 'top-right',
    showIndex: true,
    showIndicators: true,
    loop: true
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

// 管理操作选择
const onManageSelect = (action) => {
  showManageSheet.value = false
  if (action.value === 'edit') {
    // 打开编辑弹窗，填充当前数据
    editForm.value = {
      title: item.value.title,
      price: item.value.price,
      condition: item.value.condition,
      description: item.value.description || ''
    }
    showEditPopup.value = true
  } else if (action.value === 'delete') {
    // 二次确认删除
    showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这个商品吗？删除后将无法恢复。',
      confirmButtonColor: '#ee0a24'
    }).then(() => {
      confirmDelete()
    }).catch(() => {})
  }
}

// 新旧程度选择
const onConditionConfirm = ({ selectedOptions }) => {
  editForm.value.condition = selectedOptions[0].value
  showConditionPicker.value = false
}

// 保存修改
const saveEdit = async () => {
  if (!editForm.value.title.trim()) {
    showToast('请输入商品标题')
    return
  }
  if (!editForm.value.price || parseFloat(editForm.value.price) < 0) {
    showToast('请输入有效价格')
    return
  }
  if (parseFloat(editForm.value.price) > 100000000) {
    showToast('价格不能超过1亿元')
    return
  }
  
  try {
    await updateItem(route.params.id, {
      title: editForm.value.title,
      price: parseFloat(editForm.value.price),
      condition: editForm.value.condition,
      description: editForm.value.description
    })
    showSuccessToast('修改成功')
    showEditPopup.value = false
    fetchDetail() // 刷新详情
  } catch (error) {
    // 错误已在拦截器处理
  }
}

// 确认删除
const confirmDelete = async () => {
  try {
    await deleteItem(route.params.id)
    showSuccessToast('删除成功')
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

/* 编辑弹窗 */
.edit-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.edit-header h3 {
  font-size: 16px;
  font-weight: 500;
}

.edit-header span {
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.edit-header .save-btn {
  color: #1989fa;
  font-weight: 500;
}

.edit-form {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  /* 图片轮播 */
  .image-swipe {
    height: 280px;
  }
  
  /* 商品信息 */
  .item-info {
    padding: 12px;
  }
  
  .price {
    font-size: 20px;
  }
  
  .item-title {
    font-size: 15px;
    margin: 8px 0 6px;
  }
  
  .item-meta {
    font-size: 11px;
  }
  
  .item-dorm {
    margin-top: 8px;
    padding: 6px 10px;
    font-size: 12px;
  }
  
  /* 商品描述 */
  .item-desc {
    padding: 12px;
    margin-bottom: 10px;
  }
  
  .item-desc h3 {
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  .item-desc p {
    font-size: 13px;
    line-height: 1.5;
  }
  
  /* 管理入口 */
  .delete-entry {
    padding: 12px;
    font-size: 13px;
  }
  
  /* 底部操作栏 */
  .bottom-bar {
    padding: 10px 12px;
  }
  
  .bottom-bar .van-button {
    height: 40px;
    font-size: 14px;
  }
  
  /* 联系方式弹窗 */
  .contact-popup {
    padding: 20px;
  }
  
  .contact-popup h3 {
    font-size: 16px;
    margin-bottom: 12px;
  }
  
  .contact-info {
    padding: 12px;
    font-size: 15px;
    gap: 10px;
  }
  
  .contact-tip {
    margin-top: 12px;
    font-size: 11px;
  }
  
  /* 编辑弹窗 */
  .edit-header {
    padding: 12px;
  }
  
  .edit-header h3 {
    font-size: 15px;
  }
  
  .edit-header span {
    font-size: 13px;
  }
  
  .edit-form {
    padding: 10px 0;
  }
  
  /* 标签调整 */
  :deep(.van-tag) {
    font-size: 11px;
    padding: 2px 6px;
  }
}
/* 导航栏修复 - 增大标题和箭头 */
:deep(.van-nav-bar__title) {
  line-height: 1.5;
  padding: 8px 0;
  overflow: visible;
  font-size: 18px !important;
  font-weight: 500;
}

:deep(.van-nav-bar) {
  height: auto;
  min-height: 50px;
  padding: 10px 16px;
}

:deep(.van-nav-bar__left) {
  padding-right: 12px;
}

:deep(.van-nav-bar__arrow) {
  font-size: 20px !important;
  margin-right: 4px;
}

/* 手机端导航栏加大 */
@media screen and (max-width: 768px) {
  :deep(.van-nav-bar__title) {
    font-size: 20px !important;
    font-weight: 600;
  }
  
  :deep(.van-nav-bar) {
    min-height: 56px;
    padding: 12px 16px;
  }
  
  :deep(.van-nav-bar__arrow) {
    font-size: 24px !important;
    margin-right: 8px;
  }
  
  :deep(.van-nav-bar__left) {
    padding-right: 16px;
    min-width: 48px;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* 价格和新旧程度背景修复 - 增大背景 */
.price-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.price {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  color: white;
  padding: 10px 18px !important;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

:deep(.van-tag) {
  padding: 8px 14px !important;
  font-size: 13px !important;
  border-radius: 16px;
}

/* 管理商品弹窗修复 - 增大文字和防止重叠 */
:deep(.van-action-sheet__item) {
  padding: 18px 20px !important;
  line-height: 1.6 !important;
  height: auto !important;
  min-height: 56px !important;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

:deep(.van-action-sheet__name) {
  line-height: 1.5 !important;
  font-size: 16px !important;
  margin-bottom: 4px;
  display: block;
  width: 100%;
}

:deep(.van-action-sheet__description) {
  margin-top: 6px !important;
  line-height: 1.4 !important;
  font-size: 13px !important;
  color: #969799;
  display: block;
  width: 100%;
  white-space: normal;
  word-break: break-word;
}

/* 修复表单弹窗 */
:deep(.van-dialog__header) {
  padding-top: 24px;
  line-height: 1.5;
}

:deep(.van-dialog__message) {
  padding: 20px 24px;
  line-height: 1.5;
  overflow: visible;
}

:deep(.van-field__label) {
  display: flex;
  align-items: center;
  line-height: 24px;
}

:deep(.van-field__control) {
  line-height: 24px;
}

/* 修复Toast文字竖排 - 强制横向显示 */
:deep(.van-toast) {
  word-break: keep-all !important;
  white-space: nowrap !important;
  min-width: 120px !important;
  max-width: 80% !important;
}

:deep(.van-toast__text) {
  display: inline-block !important;
  white-space: nowrap !important;
  word-break: keep-all !important;
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
}

/* 修复编辑弹窗中的描述显示不全 */
:deep(.van-popup--bottom) {
  max-height: 80vh;
  overflow-y: auto;
}

.edit-form :deep(.van-field__control) {
  min-height: 60px;
  max-height: 200px;
  overflow-y: auto;
  word-break: break-word;
  white-space: pre-wrap;
}

.edit-form :deep(textarea.van-field__control) {
  min-height: 100px !important;
  padding: 8px;
  line-height: 1.5;
}
</style>
