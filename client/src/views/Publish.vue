<template>
  <div class="publish-page">
    <!-- 导航栏 -->
    <van-nav-bar
      title="发布商品"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    />

    <div class="form-container">
      <!-- 图片上传 -->
      <div class="upload-section">
        <van-uploader
          v-model="fileList"
          :max-count="9"
          :max-size="5 * 1024 * 1024"
          :before-read="beforeRead"
          :after-read="afterRead"
          @oversize="onOversize"
          multiple
        >
          <template #default>
            <div class="upload-placeholder">
              <van-icon name="plus" size="24" />
              <span>上传图片</span>
              <span class="upload-tip">最多9张，自动压缩</span>
            </div>
          </template>
        </van-uploader>
      </div>

      <!-- 表单 -->
      <van-cell-group inset>
        <!-- 标题 -->
        <van-field
          v-model="form.title"
          label="标题"
          placeholder="请输入商品标题（最多50字）"
          maxlength="50"
          show-word-limit
          required
        />

        <!-- 价格 -->
        <van-field
          v-model="form.price"
          label="价格"
          type="number"
          placeholder="请输入价格"
          required
        />

        <!-- 分类 -->
        <van-field
          v-model="categoryName"
          label="分类"
          placeholder="请选择分类"
          readonly
          is-link
          required
          @click="showCategoryPicker = true"
        />

        <!-- 新旧程度 -->
        <van-field
          v-model="form.condition"
          label="新旧程度"
          placeholder="请选择新旧程度"
          readonly
          is-link
          required
          @click="showConditionPicker = true"
        />

        <!-- 描述 -->
        <van-field
          v-model="form.description"
          label="描述"
          type="textarea"
          placeholder="描述一下宝贝的品牌、型号、购买渠道、转手原因等"
          maxlength="500"
          show-word-limit
          rows="4"
          autosize
        />
      </van-cell-group>

      <div class="info-tip">
        <van-icon name="info-o" />
        <span>商品的宿舍位置和联系方式将自动使用您的个人信息</span>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-section">
        <van-button
          type="primary"
          block
          round
          :loading="submitting"
          loading-text="发布中..."
          @click="handleSubmit"
        >
          确认发布
        </van-button>
      </div>
    </div>

    <!-- 分类选择器 -->
    <van-popup v-model:show="showCategoryPicker" position="bottom" round>
      <van-picker
        :columns="categoryColumns"
        @confirm="onCategoryConfirm"
        @cancel="showCategoryPicker = false"
      />
    </van-popup>

    <!-- 新旧程度选择器 -->
    <van-popup v-model:show="showConditionPicker" position="bottom" round>
      <van-picker
        :columns="conditionColumns"
        @confirm="onConditionConfirm"
        @cancel="showConditionPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { getCategoryList, uploadImage, publishItem } from '@/api'
import { compressImage } from '@/utils/imageCompress'

const router = useRouter()

// 表单数据
const form = ref({
  title: '',
  price: '',
  category_id: '',
  condition: '',
  description: ''
})

// 文件列表
const fileList = ref([])
const uploadedUrls = ref([])

// 分类
const categories = ref([])
const showCategoryPicker = ref(false)
const categoryName = computed(() => {
  const cat = categories.value.find(c => c.id === form.value.category_id)
  return cat ? cat.name : ''
})
const categoryColumns = computed(() => {
  return categories.value.filter(c => c.id !== 0).map(c => ({
    text: c.name,
    value: c.id
  }))
})

// 新旧程度
const showConditionPicker = ref(false)
const conditionColumns = [
  { text: '全新', value: '全新' },
  { text: '九五新', value: '九五新' },
  { text: '九成新', value: '九成新' },
  { text: '八成新', value: '八成新' },
  { text: '七成新及以下', value: '七成新及以下' }
]

// 提交状态
const submitting = ref(false)

// 获取分类列表
const fetchCategories = async () => {
  try {
    const res = await getCategoryList()
    categories.value = res.data
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 图片上传前处理（压缩）
const beforeRead = async (file) => {
  // 如果是数组（多选）
  if (Array.isArray(file)) {
    const results = []
    for (const f of file) {
      try {
        const compressed = await compressImage(f.file || f)
        results.push(compressed)
      } catch {
        results.push(f.file || f)
      }
    }
    return results
  }
  
  // 单个文件
  try {
    const compressed = await compressImage(file.file || file)
    return compressed
  } catch {
    return file.file || file
  }
}

// 图片上传后处理
const afterRead = async (file) => {
  // 处理单个或多个文件
  const files = Array.isArray(file) ? file : [file]
  
  for (const f of files) {
    f.status = 'uploading'
    f.message = '上传中...'
    
    try {
      const res = await uploadImage(f.file)
      f.status = 'done'
      f.message = ''
      f.url = res.data.url
      uploadedUrls.value.push(res.data.url)
    } catch (error) {
      f.status = 'failed'
      f.message = '上传失败'
    }
  }
}

// 文件超限
const onOversize = () => {
  showToast('图片大小不能超过5MB')
}

// 分类选择确认
const onCategoryConfirm = ({ selectedOptions }) => {
  form.value.category_id = selectedOptions[0].value
  showCategoryPicker.value = false
}

// 新旧程度选择确认
const onConditionConfirm = ({ selectedOptions }) => {
  form.value.condition = selectedOptions[0].value
  showConditionPicker.value = false
}

// 表单验证
const validateForm = () => {
  if (fileList.value.length === 0) {
    showToast('请至少上传一张图片')
    return false
  }
  
  const failedUploads = fileList.value.filter(f => f.status === 'failed')
  if (failedUploads.length > 0) {
    showToast('有图片上传失败，请删除后重试')
    return false
  }
  
  const uploadingFiles = fileList.value.filter(f => f.status === 'uploading')
  if (uploadingFiles.length > 0) {
    showToast('图片正在上传中，请稍候')
    return false
  }
  
  if (!form.value.title.trim()) {
    showToast('请输入商品标题')
    return false
  }
  
  const price = parseFloat(form.value.price)
  if (isNaN(price) || price < 0) {
    showToast('价格必须大于等于0元')
    return false
  }
  
  if (price > 100000000) {
    showToast('价格不能超过1亿元')
    return false
  }
  
  if (!form.value.category_id) {
    showToast('请选择分类')
    return false
  }
  
  if (!form.value.condition) {
    showToast('请选择新旧程度')
    return false
  }
  
  return true
}

// 提交发布
const handleSubmit = async () => {
  if (!validateForm()) return
  
  submitting.value = true
  try {
    // 收集已上传的图片URL
    const imageUrls = fileList.value
      .filter(f => f.status === 'done' && f.url)
      .map(f => f.url)
    
    await publishItem({
      title: form.value.title,
      price: parseFloat(form.value.price),
      category_id: form.value.category_id,
      condition: form.value.condition,
      description: form.value.description,
      image_urls: imageUrls
    })
    
    showSuccessToast('发布成功')
    router.replace('/')
  } catch (error) {
    // 错误已在拦截器处理
  } finally {
    submitting.value = false
  }
}

// 生命周期
onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.publish-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 100px;
}

.form-container {
  padding: 12px;
}

/* 上传区域 */
.upload-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.upload-placeholder {
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f7f8fa;
  border-radius: 4px;
  color: #969799;
  font-size: 12px;
}

.upload-tip {
  font-size: 10px;
  color: #c8c9cc;
  margin-top: 4px;
}

/* 信息提示 */
.info-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  font-size: 12px;
  color: #969799;
}

/* 提交按钮 */
.submit-section {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 16px;
  background-color: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

/* Vant 样式覆盖 */
:deep(.van-cell-group--inset) {
  margin: 0;
  border-radius: 8px;
}

:deep(.van-uploader__wrapper) {
  gap: 8px;
}

:deep(.van-uploader__preview) {
  margin: 0;
}

:deep(.van-uploader__preview-image) {
  width: 80px;
  height: 80px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .publish-page {
    padding-bottom: 60px;
  }
  
  /* 导航栏标题样式修复 */
  :deep(.van-nav-bar__title) {
    line-height: 1.5;
    padding: 8px 0;
    overflow: visible;
    font-size: 16px;
  }
  
  :deep(.van-nav-bar) {
    height: auto;
    min-height: 46px;
    padding: 8px 16px;
  }
  
  /* 基础表单 */
  .base-form {
    padding: 12px;
    margin-bottom: 10px;
  }
  
  .base-form h3 {
    font-size: 14px;
    margin-bottom: 10px;
  }
  
  /* 上传区域 */
  .upload-section {
    padding: 12px;
    margin-bottom: 10px;
  }
  
  .upload-placeholder {
    width: 70px;
    height: 70px;
    font-size: 11px;
  }
  
  .upload-tip {
    font-size: 9px;
    margin-top: 3px;
  }
  
  /* 信息提示 */
  .info-tip {
    padding: 10px 12px;
    font-size: 11px;
  }
  
  /* 提交按钮 */
  .submit-section {
    padding: 10px 12px;
  }
  
  .submit-section .van-button {
    height: 40px;
    font-size: 14px;
  }
  
  /* Vant 组件调整 */
  :deep(.van-cell) {
    padding: 10px 12px;
  }
  
  :deep(.van-field__label) {
    font-size: 13px;
    width: 70px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  
  :deep(.van-field__value) {
    font-size: 13px;
  }
  
  :deep(.van-field__body) {
    line-height: 1.5;
  }
  
  :deep(.van-field__body textarea) {
    min-height: 80px;
    font-size: 13px;
    line-height: 1.5;
  }
  
  /* 描述字段的提示文字行高修复 */
  :deep(.van-field__word-limit) {
    line-height: 1.4;
    margin-top: 4px;
    position: absolute;
    right: 12px;
    bottom: 8px;
    background: rgba(255, 255, 255, 0.95);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: #999;
    z-index: 10;
  }
  
  /* 手机端字数统计位置调整 */
  @media screen and (max-width: 768px) {
    :deep(.van-field__word-limit) {
      right: 8px;
      bottom: 6px;
      padding: 1px 4px;
      font-size: 10px;
    }
    
    :deep(.van-field__control) {
      padding-right: 50px !important;
    }
    
    :deep(.van-field__body textarea) {
      padding-right: 50px !important;
    }
  }
  
  /* 确保输入框有足够的右边距，避免被字数统计遮挡 */
  :deep(.van-field__control) {
    padding-right: 60px !important;
  }
  
  :deep(.van-field__body textarea) {
    padding-right: 60px !important;
  }
  
  /* 电脑端字数统计位置调整 */
  @media screen and (min-width: 769px) {
    :deep(.van-field__word-limit) {
      right: 16px;
      bottom: 12px;
      padding: 3px 8px;
      font-size: 12px;
    }
    
    :deep(.van-field__control) {
      padding-right: 80px !important;
    }
    
    :deep(.van-field__body textarea) {
      padding-right: 80px !important;
    }
  }
  
  :deep(.van-uploader__wrapper) {
    gap: 6px;
  }
  
  :deep(.van-uploader__preview-image) {
    width: 70px;
    height: 70px;
  }
  
  :deep(.van-uploader__upload) {
    width: 70px;
    height: 70px;
  }
}
/* 表单对齐修复 */
:deep(.van-field__label) {
  display: flex;
  align-items: center;
  line-height: 24px;
}

:deep(.van-field__value) {
  display: flex;
  align-items: center;
}

:deep(.van-field__control) {
  line-height: 24px;
}

:deep(.van-field__body) {
  align-items: center;
}
</style>
