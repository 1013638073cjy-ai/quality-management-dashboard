import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Alert,
} from 'antd'
import type { TableColumnsType } from 'antd'
import type { Dayjs } from 'dayjs'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'

import DetectionForm from '../components/DetectionForm'
import type {
  DetectionRecord,
  DetectionFormValues,
  DetectionStatus,
} from '../types/detection'
import {
  getDetectionList,
  addDetection,
  editDetection,
  deleteDetection,
} from '../api/detectionApi'

const { RangePicker } = DatePicker

// 根据检测结果返回不同颜色
function getStatusColor(status: DetectionStatus) {
  const colors = {
    合格: 'green',
    不合格: 'red',
    待检测: 'orange',
  }
  return colors[status]
}

export default function Detection() {
  // 1. 检测记录

  const [data, setData] = useState<DetectionRecord[]>([])

  // 首次加载和手动刷新时使用
  const [loading, setLoading] = useState(false)

  // 保存、删除等操作进行中
  const [submitting, setSubmitting] = useState(false)

  // 接口错误提示
  const [loadError, setLoadError] = useState('')

  // 2. 搜索和筛选条件
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<DetectionStatus | undefined>()
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)

  // 3. 弹窗与抽屉状态
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DetectionRecord | null>(null)
  const [detailRecord, setDetailRecord] = useState<DetectionRecord | null>(null)

  // 4. 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // Ant Design 表单实例
  const [form] = Form.useForm<DetectionFormValues>()

  // 页面首次挂载时从 Express 后端获取数据
  useEffect(() => {
    let active = true

    const fetchData = async () => {
      setLoading(true)
      setLoadError('')

      try {
        const list = await getDetectionList()

        // 避免组件卸载后继续更新状态
        if (active) {
          setData(list)
        }
      } catch (error) {
        if (active) {
          const msg = error instanceof Error ? error.message : '加载失败'
          setLoadError(msg)
          message.error(msg)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      active = false
    }
  }, [])

  // 使用 useMemo 缓存筛选结果
  const filteredData = useMemo(() => {
    const searchText = keyword.trim().toLowerCase()

    return data.filter((item) => {
      // 关键词支持搜索物料名称、编号、检测人员
      const matchKeyword =
        !searchText ||
        item.materialName.toLowerCase().includes(searchText) ||
        item.id.toLowerCase().includes(searchText) ||
        item.inspector.toLowerCase().includes(searchText)

      const matchStatus = !status || item.status === status

      // ISO 日期字符串 YYYY-MM-DD 可以按字典序比较
      const matchDate =
        !dateRange ||
        (item.date >= dateRange[0].format('YYYY-MM-DD') &&
          item.date <= dateRange[1].format('YYYY-MM-DD'))

      return matchKeyword && matchStatus && matchDate
    })
  }, [data, keyword, status, dateRange])

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ status: '待检测' })
    setModalOpen(true)
  }

  // 打开编辑弹窗并回填记录
  const handleEdit = (record: DetectionRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      materialName: record.materialName,
      materialType: record.materialType,
      inspector: record.inspector,
      date: record.date,
      status: record.status,
      remark: record.remark,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    let values: DetectionFormValues

    // 第一步：先校验表单
    try {
      values = await form.validateFields()
    } catch {
      // 表单校验失败，Ant Design 会显示字段错误
      return
    }

    setSubmitting(true)

    try {
      if (editingRecord) {
        // 编辑：PUT 请求
        const updated = await editDetection(editingRecord.id, values)

        setData((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))

        message.success('编辑成功')
      } else {
        // 新增：POST 请求
        const created = await addDetection(values)

        setData((prev) => [created, ...prev])
        setCurrentPage(1)

        message.success('新增成功')
      }

      setModalOpen(false)
      setEditingRecord(null)
      form.resetFields()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSubmitting(true)

    try {
      // 等待 DELETE 请求成功
      await deleteDetection(id)

      // 再从 React 状态中移除对应记录
      setData((prev) => prev.filter((item) => item.id !== id))

      setCurrentPage(1)
      message.success('删除成功')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 重置全部搜索条件
  const handleReset = () => {
    setKeyword('')
    setStatus(undefined)
    setDateRange(null)
    setCurrentPage(1)
  }

  // Table 列配置
  const columns: TableColumnsType<DetectionRecord> = [
    {
      title: '检测编号',
      dataIndex: 'id',
      key: 'id',
      width: 160,
      ellipsis: true,
    },
    {
      title: '物料名称',
      dataIndex: 'materialName',
      key: 'materialName',
      width: 150,
    },
    {
      title: '物料类型',
      dataIndex: 'materialType',
      key: 'materialType',
      width: 130,
    },
    {
      title: '检测人员',
      dataIndex: 'inspector',
      key: 'inspector',
      width: 120,
    },
    {
      title: '检测日期',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: '检测结果',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: DetectionStatus) => (
        <Tag color={getStatusColor(value)}>{value}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small" onClick={() => setDetailRecord(record)}>
            详情
          </Button>

          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>

          <Popconfirm
            title="确认删除这条检测记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={3}>物料检测管理</Typography.Title>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input.Search
            placeholder="搜索编号、物料、检测人员"
            allowClear
            style={{ width: 260 }}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setCurrentPage(1)
            }}
          />

          <Select
            placeholder="检测状态"
            allowClear
            style={{ width: 150 }}
            value={status}
            onChange={(value) => {
              setStatus(value)
              setCurrentPage(1)
            }}
            options={[
              { label: '合格', value: '合格' },
              { label: '不合格', value: '不合格' },
              { label: '待检测', value: '待检测' },
            ]}
          />

          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates?.[0] && dates?.[1] ? [dates[0], dates[1]] : null)
              setCurrentPage(1)
            }}
          />

          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Card>
      {loadError && (
        <Alert
          type="error"
          showIcon
          title="检测数据加载失败"
          description={loadError}
          style={{ marginBottom: 16 }}
        />
      )}
      <Card
        title={`检测记录（${filteredData.length} 条）`}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            disabled={loading || submitting}
          >
            新增检测记录
          </Button>
        }
      >
        <Table<DetectionRecord>
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          scroll={{ x: 1050 }}
          loading={loading || submitting}
          pagination={{
            current: currentPage,
            pageSize,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page)
              setPageSize(size)
            },
          }}
        />
      </Card>

      {/* 新增和编辑共用一个弹窗 */}
      <Modal
        title={editingRecord ? '编辑检测记录' : '新增检测记录'}
        open={modalOpen}
        onOk={handleSubmit}
        confirmLoading={submitting}

        onCancel={() => {
          setModalOpen(false)
          setEditingRecord(null)
          form.resetFields()
        }}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <DetectionForm form={form} />
      </Modal>

      {/* 检测详情抽屉 */}
      <Drawer
        title="检测记录详情"
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        width={480}
      >
        {detailRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="检测编号">{detailRecord.id}</Descriptions.Item>
            <Descriptions.Item label="物料名称">
              {detailRecord.materialName}
            </Descriptions.Item>
            <Descriptions.Item label="物料类型">
              {detailRecord.materialType}
            </Descriptions.Item>
            <Descriptions.Item label="检测人员">
              {detailRecord.inspector}
            </Descriptions.Item>
            <Descriptions.Item label="检测日期">{detailRecord.date}</Descriptions.Item>
            <Descriptions.Item label="检测结果">
              <Tag color={getStatusColor(detailRecord.status)}>{detailRecord.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="检测备注">
              {detailRecord.remark || '暂无备注'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}
