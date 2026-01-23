import request from './request'

// 获取商品列表
export function getItemList(params) {
  return request.get('/items', { params })
}

// 获取商品详情
export function getItemDetail(id) {
  return request.get(`/items/${id}`)
}

// 发布商品
export function publishItem(data) {
  return request.post('/items', data)
}

// 删除商品
export function deleteItem(id, adminPassword) {
  return request.delete(`/items/${id}`, {
    data: { admin_password: adminPassword }
  })
}

// 获取分类列表
export function getCategoryList() {
  return request.get('/categories')
}

// 上传图片
export function uploadImage(file) {
  const formData = new FormData()
  formData.append('image', file)
  return request.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
