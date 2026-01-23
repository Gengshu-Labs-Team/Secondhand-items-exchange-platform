import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Vant 组件按需引入
import {
  Button, 
  Tab, 
  Tabs, 
  Card, 
  Image as VanImage, 
  Tag,
  Swipe,
  SwipeItem,
  Icon,
  NavBar,
  Field,
  Form,
  CellGroup,
  Uploader,
  Popup,
  Dialog,
  Toast,
  Picker,
  Loading,
  Empty,
  ActionSheet
} from 'vant'

// Vant 样式
import 'vant/lib/index.css'
import './styles/global.css'

const app = createApp(App)

// 注册 Vant 组件
app.use(Button)
app.use(Tab)
app.use(Tabs)
app.use(Card)
app.use(VanImage)
app.use(Tag)
app.use(Swipe)
app.use(SwipeItem)
app.use(Icon)
app.use(NavBar)
app.use(Field)
app.use(Form)
app.use(CellGroup)
app.use(Uploader)
app.use(Popup)
app.use(Dialog)
app.use(Toast)
app.use(Picker)
app.use(Loading)
app.use(Empty)
app.use(ActionSheet)

app.use(router)
app.mount('#app')
