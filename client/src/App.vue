<template>
  <router-view />
</template>

<script setup>
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 全局Toast样式修复 */
.van-toast {
  padding: 10px 16px !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  word-break: break-word !important;
  max-width: 80% !important;
}

/* 移动端Toast样式 */
@media screen and (max-width: 768px) {
  .van-toast {
    padding: 8px 12px !important;
    font-size: 13px !important;
    line-height: 1.4 !important;
  }
}

/* 全局Dialog样式修复 - 防止文字重叠 */
.van-dialog {
  line-height: 1.5 !important;
}

.van-dialog__header {
  padding: 20px 24px 10px !important;
  line-height: 1.5 !important;
}

.van-dialog__content {
  padding: 10px 24px 20px !important;
  line-height: 1.6 !important;
  min-height: auto !important;
}

.van-dialog__footer {
  padding: 0 !important;
}

.van-dialog__confirm,
.van-dialog__cancel {
  height: 48px !important;
  line-height: 48px !important;
}

/* 移动端Dialog样式 */
@media screen and (max-width: 768px) {
  .van-dialog {
    width: 85% !important;
  }
  
  .van-dialog__header {
    padding: 16px 20px 8px !important;
    font-size: 16px !important;
  }
  
  .van-dialog__content {
    padding: 8px 20px 16px !important;
    font-size: 14px !important;
    line-height: 1.5 !important;
  }
  
  .van-dialog__confirm,
  .van-dialog__cancel {
    height: 44px !important;
    line-height: 44px !important;
    font-size: 15px !important;
  }
}
</style>
