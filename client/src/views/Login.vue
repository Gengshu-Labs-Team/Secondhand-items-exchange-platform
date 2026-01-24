<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>🏫 校园二手交易</h1>
        <p class="subtitle">登录您的账号</p>
      </div>

      <van-form @submit="onSubmit" class="login-form">
        <van-cell-group inset>
          <van-field
            v-model="form.username"
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            :rules="[{ required: true, message: '请输入用户名' }]"
            autocomplete="username"
            clearable
          />
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
            autocomplete="current-password"
            clearable
          />
        </van-cell-group>

        <div class="form-actions">
          <van-button round block type="primary" native-type="submit" :loading="loading">
            登 录
          </van-button>
        </div>
      </van-form>

      <div class="login-footer">
        <p>还没有账号？<router-link to="/register" class="link">立即注册</router-link></p>
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
  password: ''
})

onMounted(() => {
  // 如果已登录，直接跳转
  const token = localStorage.getItem('token')
  if (token) {
    const redirect = route.query.redirect || '/'
    router.replace(redirect)
  }
})

const onSubmit = async () => {
  loading.value = true
  try {
    const res = await request.post('/auth/login', form.value)
    if (res.success) {
      // 保存 token 和用户信息
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      showSuccessToast('登录成功')
      
      // 获取重定向地址，排除登录页面本身
      let redirect = route.query.redirect || '/'
      // 如果重定向地址是登录页面，则跳转到首页
      if (redirect === '/login' || redirect.startsWith('/login?')) {
        redirect = '/'
      }
      router.replace(redirect)
    } else {
      showFailToast(res.message || '登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    showFailToast(error.response?.data?.message || '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 40px 30px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.login-header .subtitle {
  color: #999;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.form-actions {
  margin-top: 30px;
  padding: 0 16px;
}

.login-footer {
  text-align: center;
  color: #666;
  font-size: 14px;
}

.login-footer .link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.login-footer .link:hover {
  text-decoration: underline;
}

:deep(.van-cell-group--inset) {
  margin: 0;
}

:deep(.van-field__label) {
  width: 60px;
}

/* 增加输入框之间的间距 */
:deep(.van-cell-group .van-field) {
  padding: 16px 16px;
}

:deep(.van-cell-group .van-field:not(:last-child)) {
  margin-bottom: 12px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .login-page {
    padding: 20px;
    align-items: center;
    justify-content: center;
  }

  .login-container {
    width: 100%;
    max-width: none;
    padding: 35px 25px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
    margin: 0 auto;
  }

  .login-header h1 {
    font-size: 22px;
    white-space: nowrap !important;
    padding: 0;
    overflow: visible !important;
    text-overflow: initial !important;
    line-height: 1.4;
    display: block;
    width: 100%;
  }

  .login-header .subtitle {
    font-size: 13px;
  }

  .form-actions {
    padding: 0 10px;
    margin-top: 25px;
  }

  .login-footer {
    font-size: 13px;
    margin-top: 20px;
  }

  :deep(.van-field__label) {
    width: 60px;
    font-size: 14px;
  }

  :deep(.van-field__value) {
    font-size: 14px;
  }
  
  :deep(.van-field__control) {
    font-size: 14px;
  }
  
  :deep(.van-field__control)::placeholder {
    font-size: 30px !important;
    opacity: 0.45;
    font-weight: 400;
  }

  :deep(.van-button) {
    height: 42px;
    font-size: 15px;
  }
}
/* 修复输入框placeholder显示不全 */
:deep(.van-field__control) {
  font-size: 14px !important;
  line-height: 1.5 !important;
  overflow: visible !important;
  padding-right: 10px !important;
  width: 100% !important;
}

:deep(.van-field__control)::placeholder {
  font-size: 30px !important;
  overflow: visible !important;
  text-overflow: initial !important;
  white-space: nowrap !important;
  display: block !important;
  opacity: 0.45;
  color: #969799;
  font-weight: 400;
}

:deep(.van-field__body) {
  min-height: 30px !important;
  display: flex;
  align-items: center;
}

:deep(.van-field__value) {
  flex: 1;
  min-width: 0;
  overflow: visible !important;
}

:deep(.van-field__label) {
  flex-shrink: 0;
  margin-right: 12px !important;
}

/* 电脑端适配 - 调小placeholder文字 */
@media screen and (min-width: 769px) {
  :deep(.van-field__control)::placeholder {
    font-size: 14px !important;
    opacity: 0.6;
  }
}
</style>
