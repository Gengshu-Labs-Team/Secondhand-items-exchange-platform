import request from './request'

// 获取商品列表
export async function getItemList(params) {
  try {
    const response = await request.get('/items', { params })
    console.log('API getItemList raw response:', response)
    console.log('API response type:', typeof response)
    console.log('API response.data:', response.data)
    console.log('API response.items:', response.items)
    return response
  } catch (error) {
    console.error('API getItemList error:', error)
    throw error
  }
}

// 获取商品详情
export function getItemDetail(id) {
  return request.get(`/items/${id}`)
}

// 发布商品
export function publishItem(data) {
  return request.post('/items', data)
}

// 更新商品信息
export function updateItem(id, data) {
  return request.put(`/items/${id}`, data)
}

// 删除商品（不再需要密码）
export function deleteItem(id) {
  return request.delete(`/items/${id}`)
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
