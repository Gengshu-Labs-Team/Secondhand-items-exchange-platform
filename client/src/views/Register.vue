<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-header">
        <h1>🏫 校园二手交易</h1>
        <p class="subtitle">创建您的账号</p>
      </div>

      <van-form @submit="onSubmit" class="register-form">
        <van-cell-group inset>
          <van-field
            v-model="form.username"
            name="username"
            label="用户名"
            placeholder="3-20个字符"
            :rules="[
              { required: true, message: '请输入用户名' },
              { pattern: /^.{3,20}$/, message: '用户名需要3-20个字符' }
            ]"
            autocomplete="username"
            clearable
          />
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            label="密码"
            placeholder="至少6个字符"
            :rules="[
              { required: true, message: '请输入密码' },
              { pattern: /^.{6,}$/, message: '密码至少需要6个字符' }
            ]"
            autocomplete="new-password"
            clearable
          />
          <van-field
            v-model="form.confirmPassword"
            type="password"
            name="confirmPassword"
            label="确认密码"
            placeholder="再次输入密码"
            :rules="[
              { required: true, message: '请确认密码' },
              { validator: confirmPasswordValidator, message: '两次密码不一致' }
            ]"
            autocomplete="new-password"
            clearable
          />
          <van-field
            v-model="form.dorm_location"
            name="dorm_location"
            label="宿舍位置"
            placeholder="如：韵苑19栋603"
            :rules="[{ required: true, message: '请输入宿舍位置' }]"
            clearable
          >
            <template #left-icon>
              <van-icon name="location-o" />
            </template>
          </van-field>
          <van-field
            v-model="form.contact_info"
            name="contact_info"
            label="联系方式"
            placeholder="微信/QQ/手机号"
            :rules="[{ required: true, message: '请输入联系方式' }]"
            clearable
          >
            <template #left-icon>
              <van-icon name="chat-o" />
            </template>
          </van-field>
        </van-cell-group>

        <div class="form-actions">
          <van-button round block type="primary" native-type="submit" :loading="loading">
            注 册
          </van-button>
        </div>
      </van-form>

      <div class="register-footer">
        <p>已有账号？<router-link to="/login" class="link">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast, showFailToast } from 'vant'
import request from '../api/request'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const form = ref({
  username: '',
  password: '',
  confirmPassword: '',
  dorm_location: '',
  contact_info: ''
})

onMounted(() => {
  // 如果已登录，直接跳转
  const token = localStorage.getItem('token')
  if (token) {
    router.replace('/')
  }
})

const confirmPasswordValidator = (val) => {
  return val === form.value.password
}

// 宿舍格式验证
const dormValidator = (val) => {
  if (!val) return false
  // 必须包含"紫菘"、"沁苑"或"韵苑"之一
  const validDorms = ['紫菘', '沁苑', '韵苑']
  return validDorms.some(dorm => val.includes(dorm))
}

const onSubmit = async () => {
  if (form.value.password !== form.value.confirmPassword) {
    showFailToast('两次密码不一致')
    return
  }
  
  // 宿舍格式验证
  if (!dormValidator(form.value.dorm_location)) {
    showFailToast('宿舍位置必须包含"紫菘"、"沁苑"或"韵苑"')
    return
  }
  
  loading.value = true
  try {
    const res = await request.post('/auth/register', {
      username: form.value.username,
      password: form.value.password,
      dorm_location: form.value.dorm_location,
      contact_info: form.value.contact_info
    })
    
    if (res.success) {
      // 保存 token 和用户信息
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      showSuccessToast('注册成功')
      
      // 跳转到首页
      router.replace('/')
    } else {
      showFailToast(res.message || '注册失败')
    }
  } catch (error) {
    console.error('注册失败:', error)
    showFailToast(error.response?.data?.message || '注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-container {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 40px 30px;
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.register-header .subtitle {
  color: #999;
  font-size: 14px;
}

.register-form {
  margin-bottom: 20px;
}

.form-actions {
  margin-top: 30px;
  padding: 0 16px;
}

.register-footer {
  text-align: center;
  color: #666;
  font-size: 14px;
}

.register-footer .link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.register-footer .link:hover {
  text-decoration: underline;
}

:deep(.van-cell-group--inset) {
  margin: 0;
}

:deep(.van-field__label) {
  width: 70px;
}
</style>
