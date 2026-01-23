<template>
  <div class="admin-page">
    <!-- 顶部导航 -->
    <van-nav-bar title="管理后台" left-arrow @click-left="goBack">
      <template #right>
        <van-icon name="refresh" size="20" @click="refreshData" />
      </template>
    </van-nav-bar>

    <!-- Tab 切换 -->
    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="商品管理" name="items">
        <!-- 统计卡片 -->
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-value">{{ itemStats.total }}</div>
            <div class="stat-label">全部商品</div>
          </div>
          <div class="stat-card active">
            <div class="stat-value">{{ itemStats.online }}</div>
            <div class="stat-label">展示中</div>
          </div>
          <div class="stat-card offline">
            <div class="stat-value">{{ itemStats.offline }}</div>
            <div class="stat-label">已下架</div>
          </div>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
          <van-dropdown-menu>
            <van-dropdown-item v-model="itemFilter.status" :options="statusOptions" @change="fetchItems" />
            <van-dropdown-item v-model="itemFilter.category" :options="categoryOptions" @change="fetchItems" />
          </van-dropdown-menu>
        </div>

        <!-- 商品列表 -->
        <div class="item-list">
          <van-loading v-if="itemLoading" class="loading">加载中...</van-loading>
          
          <van-empty v-else-if="items.length === 0" description="暂无商品数据" />
          
          <template v-else>
            <div class="item-table">
              <div class="table-header">
                <span class="col-id">ID</span>
                <span class="col-image">图片</span>
                <span class="col-title">标题</span>
                <span class="col-price">价格</span>
                <span class="col-status">状态</span>
                <span class="col-action">操作</span>
              </div>
              
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
                <span class="col-title text-ellipsis">{{ item.title }}</span>
                <span class="col-price price">¥{{ item.price }}</span>
                <span class="col-status">
                  <van-tag :type="item.status === 1 ? 'success' : 'default'" size="small">
                    {{ item.status === 1 ? '上架' : '下架' }}
                  </van-tag>
                </span>
                <span class="col-action">
                  <van-button 
                    v-if="item.status === 1"
                    size="mini" 
                    type="warning"
                    @click="toggleItemStatus(item, 0)"
                  >
                    下架
                  </van-button>
                  <van-button 
                    v-else
                    size="mini" 
                    type="success"
                    @click="toggleItemStatus(item, 1)"
                  >
                    上架
                  </van-button>
                  <van-button 
                    size="mini" 
                    type="danger"
                    @click="deleteItem(item)"
                  >
                    删除
                  </van-button>
                </span>
              </div>
            </div>

            <div class="pagination">
              <van-pagination 
                v-model="itemPage" 
                :total-items="itemTotal" 
                :items-per-page="10"
                :show-page-size="3"
                @change="fetchItems"
              />
            </div>
          </template>
        </div>
      </van-tab>

      <van-tab title="用户管理" name="users">
        <!-- 用户统计 -->
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-value">{{ userStats.total }}</div>
            <div class="stat-label">全部用户</div>
          </div>
          <div class="stat-card active">
            <div class="stat-value">{{ userStats.active }}</div>
            <div class="stat-label">正常</div>
          </div>
          <div class="stat-card offline">
            <div class="stat-value">{{ userStats.disabled }}</div>
            <div class="stat-label">已禁用</div>
          </div>
        </div>

        <!-- 用户搜索 -->
        <div class="search-bar">
          <van-search 
            v-model="userKeyword" 
            placeholder="搜索用户名/宿舍/联系方式"
            @search="fetchUsers"
            @clear="fetchUsers"
          />
        </div>

        <!-- 用户列表 -->
        <div class="user-list">
          <van-loading v-if="userLoading" class="loading">加载中...</van-loading>
          
          <van-empty v-else-if="users.length === 0" description="暂无用户数据" />
          
          <template v-else>
            <div class="user-cards">
              <div 
                v-for="user in users" 
                :key="user.id" 
                class="user-card"
                :class="{ disabled: user.status === 0 }"
              >
                <div class="user-header">
                  <div class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
                  <div class="user-info">
                    <div class="user-name">
                      {{ user.username }}
                      <van-tag v-if="user.role === 'admin'" type="danger" size="small">管理员</van-tag>
                      <van-tag v-if="user.status === 0" type="default" size="small">已禁用</van-tag>
                    </div>
                    <div class="user-meta">
                      <span>🏠 {{ user.dorm_location || '未设置' }}</span>
                      <span>📱 {{ user.contact_info || '未设置' }}</span>
                    </div>
                  </div>
                </div>
                <div class="user-actions">
                  <van-button 
                    size="small" 
                    type="primary"
                    @click="editUser(user)"
                  >
                    编辑
                  </van-button>
                  <van-button 
                    size="small" 
                    :type="user.status === 1 ? 'warning' : 'success'"
                    @click="toggleUserStatus(user)"
                    :disabled="user.role === 'admin'"
                  >
                    {{ user.status === 1 ? '禁用' : '启用' }}
                  </van-button>
                  <van-button 
                    size="small" 
                    type="default"
                    @click="resetPassword(user)"
                  >
                    重置密码
                  </van-button>
                </div>
              </div>
            </div>

            <div class="pagination">
              <van-pagination 
                v-model="userPage" 
                :total-items="userTotal" 
                :items-per-page="10"
                :show-page-size="3"
                @change="fetchUsers"
              />
            </div>
          </template>
        </div>

        <!-- 添加用户按钮 -->
        <div class="fab-button" @click="showAddUser = true">
          <van-icon name="plus" size="24" />
        </div>
      </van-tab>
    </van-tabs>

    <!-- 编辑用户弹窗 -->
    <van-dialog
      v-model:show="showEditUser"
      :title="editingUser.id ? '编辑用户' : '添加用户'"
      show-cancel-button
      @confirm="saveUser"
    >
      <van-form class="user-form">
        <van-field
          v-model="editingUser.username"
          label="用户名"
          placeholder="3-20个字符"
          :disabled="!!editingUser.id"
        />
        <van-field
          v-if="!editingUser.id"
          v-model="editingUser.password"
          type="password"
          label="密码"
          placeholder="至少6个字符"
        />
        <van-field
          v-model="editingUser.dorm_location"
          label="宿舍位置"
          placeholder="如: 韵苑19栋"
        />
        <van-field
          v-model="editingUser.contact_info"
          label="联系方式"
          placeholder="微信/QQ/手机号"
        />
        <van-field
          v-model="editingUser.role"
          label="角色"
          readonly
          is-link
          @click="showRolePicker = true"
        />
      </van-form>
    </van-dialog>

    <!-- 角色选择器 -->
    <van-popup v-model:show="showRolePicker" position="bottom" round>
      <van-picker
        :columns="roleOptions"
        @confirm="onRoleConfirm"
        @cancel="showRolePicker = false"
      />
    </van-popup>

    <!-- 重置密码弹窗 -->
    <van-dialog
      v-model:show="showResetPassword"
      title="重置密码"
      show-cancel-button
      @confirm="confirmResetPassword"
    >
      <van-field
        v-model="newPassword"
        type="password"
        label="新密码"
        placeholder="至少6个字符"
        class="dialog-field"
      />
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import request from '@/api/request'

const router = useRouter()

// Tab 状态
const activeTab = ref('items')

// ========== 商品管理 ==========
const itemLoading = ref(false)
const items = ref([])
const itemTotal = ref(0)
const itemPage = ref(1)
const categories = ref([])

const itemFilter = reactive({
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

const itemStats = computed(() => ({
  total: itemTotal.value,
  online: items.value.filter(i => i.status === 1).length,
  offline: items.value.filter(i => i.status === 0).length
}))

// ========== 用户管理 ==========
const userLoading = ref(false)
const users = ref([])
const userTotal = ref(0)
const userPage = ref(1)
const userKeyword = ref('')

const showEditUser = ref(false)
const showAddUser = ref(false)
const showRolePicker = ref(false)
const showResetPassword = ref(false)
const editingUser = ref({})
const resetUserId = ref(null)
const newPassword = ref('')

const roleOptions = [
  { text: '普通用户', value: 'user' },
  { text: '管理员', value: 'admin' }
]

const userStats = computed(() => ({
  total: userTotal.value,
  active: users.value.filter(u => u.status === 1).length,
  disabled: users.value.filter(u => u.status === 0).length
}))

// 监听添加用户
watch(showAddUser, (val) => {
  if (val) {
    editingUser.value = { username: '', password: '', dorm_location: '', contact_info: '', role: 'user' }
    showEditUser.value = true
    showAddUser.value = false
  }
})

// ========== 商品相关方法 ==========
const fetchItems = async () => {
  itemLoading.value = true
  try {
    const params = {
      page: itemPage.value,
      limit: 10
    }
    if (itemFilter.status !== 'all') {
      params.status = itemFilter.status
    }
    if (itemFilter.category !== 0) {
      params.category_id = itemFilter.category
    }
    
    const res = await request.get('/items/admin', { params })
    items.value = res.data.items
    itemTotal.value = res.data.total
  } catch (error) {
    console.error('获取商品列表失败:', error)
  } finally {
    itemLoading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res = await request.get('/categories')
    categories.value = res.data
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

const getFirstImage = (imageUrls) => {
  if (!imageUrls) return ''
  try {
    const urls = typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls
    return urls[0] || ''
  } catch {
    return ''
  }
}

const toggleItemStatus = async (item, status) => {
  try {
    await request.put(`/items/${item.id}/status`, { status })
    showSuccessToast(status === 1 ? '已上架' : '已下架')
    fetchItems()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

const deleteItem = async (item) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要永久删除「${item.title}」吗？`
    })
    await request.delete(`/items/${item.id}/force`)
    showSuccessToast('已删除')
    fetchItems()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

// ========== 用户相关方法 ==========
const fetchUsers = async () => {
  userLoading.value = true
  try {
    const params = {
      page: userPage.value,
      pageSize: 10,
      keyword: userKeyword.value
    }
    
    const res = await request.get('/users', { params })
    users.value = res.data.list
    userTotal.value = res.data.total
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    userLoading.value = false
  }
}

const editUser = (user) => {
  editingUser.value = { ...user }
  showEditUser.value = true
}

const saveUser = async () => {
  const user = editingUser.value
  
  if (!user.username || user.username.length < 3) {
    showToast('用户名需要3-20个字符')
    return
  }
  
  if (!user.id && (!user.password || user.password.length < 6)) {
    showToast('密码至少需要6个字符')
    return
  }
  
  try {
    if (user.id) {
      await request.put(`/users/${user.id}`, {
        dorm_location: user.dorm_location,
        contact_info: user.contact_info,
        role: user.role
      })
      showSuccessToast('更新成功')
    } else {
      await request.post('/users', user)
      showSuccessToast('创建成功')
    }
    showEditUser.value = false
    fetchUsers()
  } catch (error) {
    console.error('保存失败:', error)
  }
}

const toggleUserStatus = async (user) => {
  const newStatus = user.status === 1 ? 0 : 1
  const action = newStatus === 0 ? '禁用' : '启用'
  
  try {
    await showConfirmDialog({
      title: `确认${action}`,
      message: `确定要${action}用户「${user.username}」吗？`
    })
    await request.put(`/users/${user.id}`, { status: newStatus })
    showSuccessToast(`已${action}`)
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
    }
  }
}

const resetPassword = (user) => {
  resetUserId.value = user.id
  newPassword.value = ''
  showResetPassword.value = true
}

const confirmResetPassword = async () => {
  if (!newPassword.value || newPassword.value.length < 6) {
    showToast('密码至少需要6个字符')
    return
  }
  
  try {
    await request.put(`/users/${resetUserId.value}/password`, {
      password: newPassword.value
    })
    showSuccessToast('密码已重置')
    showResetPassword.value = false
  } catch (error) {
    console.error('重置密码失败:', error)
  }
}

const onRoleConfirm = ({ selectedOptions }) => {
  editingUser.value.role = selectedOptions[0].value
  showRolePicker.value = false
}

// ========== 通用方法 ==========
const goBack = () => {
  router.push('/')
}

const refreshData = () => {
  if (activeTab.value === 'items') {
    fetchItems()
  } else {
    fetchUsers()
  }
}

// 生命周期
onMounted(() => {
  fetchCategories()
  fetchItems()
  fetchUsers()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 80px;
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

/* 搜索栏 */
.search-bar {
  background: #fff;
}

/* 商品列表 */
.item-list, .user-list {
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
.col-title { flex: 1; min-width: 0; padding: 0 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-price { width: 60px; text-align: right; color: #ff4d4f; }
.col-status { width: 50px; text-align: center; }
.col-action { width: 100px; display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; }

/* 用户卡片 */
.user-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.user-card.disabled {
  opacity: 0.6;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 12px;
}

.user-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 分页 */
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

/* 浮动按钮 */
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

/* 表单 */
.user-form {
  padding: 16px;
}

.dialog-field {
  margin: 16px;
}
</style>
