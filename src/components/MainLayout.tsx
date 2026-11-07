import { useState } from 'react'
import { Layout, Menu, Typography } from 'antd'
import {
  DashboardOutlined,
  FileSearchOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const { Header, Sider, Content } = Layout

// 侧边栏菜单配置
const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '数据概览' },
  { key: '/detection', icon: <FileSearchOutlined />, label: '物料检测管理' },
  { key: '/virtual-list', icon: <DatabaseOutlined />, label: '大数据检测明细' },
]

export default function MainLayout() {
  // 控制侧边栏是否收起
  const [collapsed, setCollapsed] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        theme="dark"
      >
        <div className="logo">
          <SafetyCertificateOutlined />
          {!collapsed && <span>质量管理平台</span>}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header className="app-header">
          <span className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>

          <Typography.Text strong>企业质量管理系统</Typography.Text>
        </Header>

        <Content className="app-content">
          {/* 子路由对应的页面显示在这里 */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
