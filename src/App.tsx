import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Spin } from 'antd'

import MainLayout from './components/MainLayout'
import './App.css'

// 路由懒加载：只有进入对应页面才加载页面组件
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Detection = lazy(() => import('./pages/Detection'))
const VirtualList = lazy(() => import('./pages/VirtualList'))

// 异步组件加载期间显示的占位内容
function PageLoading() {
  return (
    <div
      style={{
        minHeight: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Spin size="large" tip="页面加载中">
        <div style={{ width: 160, height: 80 }} />
      </Spin>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公共布局仍然保留 */}
        <Route path="/" element={<MainLayout />}>
          <Route
            index
            element={
              <Suspense fallback={<PageLoading />}>
                <Dashboard />
              </Suspense>
            }
          />

          <Route
            path="detection"
            element={
              <Suspense fallback={<PageLoading />}>
                <Detection />
              </Suspense>
            }
          />

          <Route
            path="virtual-list"
            element={
              <Suspense fallback={<PageLoading />}>
                <VirtualList />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
