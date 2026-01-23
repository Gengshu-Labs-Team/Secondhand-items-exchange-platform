<template>
  <div class="profile-page">
    <van-nav-bar
      title="个人中心"
      left-arrow
      @click-left="$router.back()"
    />
    
    <div class="profile-content">
      <!-- 用户信息卡片 -->
      <div class="user-card">
        <div class="avatar">
          <van-icon name="user-circle-o" size="60" color="#667eea" />
        </div>
        <div class="user-info">
          <h2>{{ user.username }}</h2>
          <van-tag :type="user.role === 'admin' ? 'danger' : 'primary'" size="medium">
            {{ user.role === 'admin' ? '管理员' : '普通用户' }}
          </van-tag>
        </div>
      </div>

      <!-- 信息编辑 -->
      <van-cell-group inset title="基本信息">
        <van-field
          v-model="form.dorm_location"
          label="宿舍位置"
          placeholder="请输入宿舍位置"
          clearable
        />
        <van-field
          v-model="form.contact_info"
          label="联系方式"
          placeholder="微信/QQ/手机号"
          clearable
        />
      </van-cell-group>

      <div class="action-buttons">
        <van-button type="primary" block round :loading="saving" @click="saveProfile">
          保存修改
        </van-button>
      </div>

      <!-- 修改密码 -->
      <van-cell-group inset title="修改密码">
        <van-field
          v-model="passwordForm.oldPassword"
          type="password"
          label="原密码"
          placeholder="请输入原密码"
          clearable
        />
        <van-field
          v-model="passwordForm.newPassword"
          type="password"
          label="新密码"
          placeholder="至少6个字符"
          clearable
        />
        <van-field
          v-model="passwordForm.confirmPassword"
          type="password"
          label="确认密码"
          placeholder="再次输入新密码"
          clearable
        />
      </van-cell-group>

      <div class="action-buttons">
        <van-button type="warning" block round :loading="changingPassword" @click="changePassword">
          修改密码
        </van-button>
      </div>

      <!-- 功能入口 -->
      <van-cell-group inset title="我的功能">
        <van-cell title="我的发布" is-link to="/my-items" icon="notes-o" />
        <van-cell v-if="user.role === 'admin'" title="管理后台" is-link to="/admin" icon="setting-o" />
      </van-cell-group>

      <!-- 退出登录 -->
      <div class="logout-section">
        <van-button type="default" block round @click="logout">
          退出登录
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showFailToast, showConfirmDialog } from 'vant'
import request from '../api/request'

const router = useRouter()

const user = ref({})
const form = ref({
  dorm_location: '',
  contact_info: ''
})
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const saving = ref(false)
const changingPassword = ref(false)

onMounted(() => {
  loadUserInfo()
})

const loadUserInfo = async () => {
  try {
    const res = await request.get('/auth/me')
    if (res.success) {
      user.value = res.data
      form.value.dorm_location = res.data.dorm_location || ''
      form.value.contact_info = res.data.contact_info || ''
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

const saveProfile = async () => {
  if (!form.value.dorm_location) {
    showFailToast('请填写宿舍位置')
    return
  }
  if (!form.value.contact_info) {
    showFailToast('请填写联系方式')
    return
  }
  
  saving.value = true
  try {
    const res = await request.put('/auth/me', form.value)
    if (res.success) {
      // 更新本地存储的用户信息
      const localUser = JSON.parse(localStorage.getItem('user') || '{}')
      localUser.dorm_location = form.value.dorm_location
      localUser.contact_info = form.value.contact_info
      localStorage.setItem('user', JSON.stringify(localUser))
      
      showSuccessToast('保存成功')
    }
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  if (!passwordForm.value.oldPassword) {
    showFailToast('请输入原密码')
    return
  }
  if (!passwordForm.value.newPassword || passwordForm.value.newPassword.length < 6) {
    showFailToast('新密码至少需要6个字符')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showFailToast('两次输入的密码不一致')
    return
  }
  
  changingPassword.value = true
  try {
    const res = await request.put('/auth/password', {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    if (res.success) {
      showSuccessToast('密码修改成功')
      passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    }
  } catch (error) {
    console.error('修改密码失败:', error)
  } finally {
    changingPassword.value = false
  }
}

const logout = async () => {
  try {
    await showConfirmDialog({
      title: '确认退出',
      message: '确定要退出登录吗？'
    })
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    showSuccessToast('已退出登录')
    router.push('/login')
  } catch {
    // 取消
  }
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.profile-content {
  padding: 16px;
}

.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.avatar {
  width: 70px;
  height: 70px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info h2 {
  color: #fff;
  font-size: 20px;
  margin-bottom: 8px;
}

.action-buttons {
  padding: 16px;
}

.logout-section {
  padding: 16px;
  margin-top: 20px;
}

:deep(.van-cell-group__title) {
  padding-left: 0;
}
</style>
