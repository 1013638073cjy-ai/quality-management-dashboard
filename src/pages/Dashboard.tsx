import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Typography,
  message,
} from 'antd'
import type { Dayjs } from 'dayjs'
import type { EChartsOption } from 'echarts'

import ChartCard from '../components/Charts/ChartCard'
import { getDetectionList } from '../api/detectionApi'
import type { DetectionRecord } from '../types/detection'
import { feedbackMock } from '../data/feedbackMock'

const { RangePicker } = DatePicker

export default function Dashboard() {
  // 1. 从 Express 获取的检测记录
  const [data, setData] = useState<DetectionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // 2. 筛选状态
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)

  const [materialType, setMaterialType] = useState<string | undefined>()

  // 3. 调用已有的检测记录 API
  useEffect(() => {
    let active = true

    const fetchData = async () => {
      setLoading(true)
      setError('')

      try {
        const list = await getDetectionList()

        if (active) {
          setData(list)
        }
      } catch (err) {
        if (active) {
          const msg = err instanceof Error ? err.message : '获取数据失败'

          setError(msg)
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
  }, [refreshKey])

  // 提取物料类型作为筛选选项
  const materialOptions = useMemo(() => {
    return [...new Set(data.map((item) => item.materialType))].sort().map((type) => ({
      label: type,
      value: type,
    }))
  }, [data])

  // 4. 根据日期和物料类型筛选数据
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchType = !materialType || item.materialType === materialType

      // YYYY-MM-DD 字符串可以按日期顺序比较
      const matchDate =
        !dateRange ||
        (item.date >= dateRange[0].format('YYYY-MM-DD') &&
          item.date <= dateRange[1].format('YYYY-MM-DD'))

      return matchType && matchDate
    })
  }, [data, materialType, dateRange])

  // 5. 计算统计卡片的数据
  const statistics = useMemo(() => {
    const total = filteredData.length

    const qualified = filteredData.filter((item) => item.status === '合格').length

    const unqualified = filteredData.filter((item) => item.status === '不合格').length

    const pending = filteredData.filter((item) => item.status === '待检测').length

    // 合格率只统计已完成检测的记录
    const completed = qualified + unqualified

    const passRate =
      completed > 0 ? Number(((qualified / completed) * 100).toFixed(2)) : null

    return {
      total,
      qualified,
      unqualified,
      pending,
      completed,
      passRate,
    }
  }, [filteredData])

  // 6. 计算每日质量合格率
  const dailyTrend = useMemo(() => {
    const dailyMap = new Map<string, { qualified: number; completed: number }>()

    filteredData.forEach((item) => {
      const current = dailyMap.get(item.date) ?? {
        qualified: 0,
        completed: 0,
      }

      if (item.status === '合格') {
        current.qualified++
        current.completed++
      } else if (item.status === '不合格') {
        current.completed++
      }

      dailyMap.set(item.date, current)
    })

    return [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        rate:
          value.completed > 0
            ? Number(((value.qualified / value.completed) * 100).toFixed(2))
            : null,
      }))
  }, [filteredData])

  // 7. 统计不同物料类型的不合格数量
  const materialFailures = useMemo(() => {
    const result = new Map<string, number>()

    filteredData.forEach((item) => {
      if (item.status === '不合格') {
        result.set(item.materialType, (result.get(item.materialType) ?? 0) + 1)
      }
    })

    return [...result.entries()].sort((a, b) => b[1] - a[1])
  }, [filteredData])

  // 8. 折线图：每日合格率
  const trendOption = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value) => (value == null ? '无已完成检测' : `${value}%`),
      },
      grid: {
        left: 45,
        right: 25,
        top: 35,
        bottom: 55,
      },
      xAxis: {
        type: 'category',
        data: dailyTrend.map((item) => item.date),
        axisLabel: {
          rotate: 30,
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        name: '合格率 (%)',
      },
      series: [
        {
          name: '合格率',
          type: 'line',
          smooth: true,
          connectNulls: false,
          data: dailyTrend.map((item) => item.rate),
          areaStyle: { opacity: 0.08 },
          itemStyle: { color: '#1677ff' },
        },
      ],
    }),
    [dailyTrend],
  )

  // 9. 环形图：检测结果分布
  const resultOption = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} 条 ({d}%)',
      },
      legend: {
        bottom: 0,
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '43%'],
          label: {
            formatter: '{b}: {c}',
          },
          data: [
            {
              name: '合格',
              value: statistics.qualified,
              itemStyle: { color: '#52c41a' },
            },
            {
              name: '不合格',
              value: statistics.unqualified,
              itemStyle: { color: '#ff4d4f' },
            },
            {
              name: '待检测',
              value: statistics.pending,
              itemStyle: { color: '#faad14' },
            },
          ],
        },
      ],
    }),
    [statistics],
  )

  // 10. 柱状图：物料不合格数量
  const materialOption = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        trigger: 'axis',
      },
      grid: {
        left: 45,
        right: 20,
        top: 30,
        bottom: 60,
      },
      xAxis: {
        type: 'category',
        data: materialFailures.map((item) => item[0]),
        axisLabel: {
          interval: 0,
          rotate: 20,
        },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        name: '不合格数量',
      },
      series: [
        {
          name: '不合格数量',
          type: 'bar',
          barMaxWidth: 42,
          data: materialFailures.map((item) => item[1]),
          itemStyle: {
            color: '#ff7875',
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    }),
    [materialFailures],
  )

  // 11. 客户投诉分类（演示数据）
  const feedbackOption = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      grid: {
        left: 85,
        right: 35,
        top: 20,
        bottom: 30,
      },
      xAxis: {
        type: 'value',
        minInterval: 1,
      },
      yAxis: {
        type: 'category',
        data: feedbackMock.map((item) => item.category),
      },
      series: [
        {
          name: '投诉数量',
          type: 'bar',
          barMaxWidth: 26,
          data: feedbackMock.map((item) => item.count),
          itemStyle: {
            color: '#69b1ff',
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: 'right',
          },
        },
      ],
    }),
    [],
  )

  return (
    <div>
      <Typography.Title level={3}>质量数据分析</Typography.Title>

      <Typography.Paragraph type="secondary">
        通过检测记录统计分析质量趋势、检测结果及物料问题分布。
      </Typography.Paragraph>

      {/* 筛选条件 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates?.[0] && dates?.[1] ? [dates[0], dates[1]] : null)
            }}
          />

          <Select
            placeholder="选择物料类型"
            allowClear
            value={materialType}
            onChange={setMaterialType}
            options={materialOptions}
            style={{ width: 180 }}
          />

          <Button
            onClick={() => {
              setDateRange(null)
              setMaterialType(undefined)
            }}
          >
            重置筛选
          </Button>

          <Button
            type="primary"
            loading={loading}
            onClick={() => setRefreshKey((prev) => prev + 1)}
          >
            刷新数据
          </Button>
        </Space>
      </Card>

      {error && (
        <Alert
          type="error"
          showIcon
          title="数据加载失败"
          description={error}
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading}>
        {/* 数据概览卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="检测记录总数" value={statistics.total} />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="已完成检测" value={statistics.completed} />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="检测合格率"
                value={statistics.passRate ?? '暂无数据'}
                suffix={statistics.passRate === null ? '' : '%'}
                precision={statistics.passRate === null ? undefined : 2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="未解决质量问题"
                value={statistics.unqualified + statistics.pending}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 第一排图表 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <ChartCard
              title="每日质量合格率趋势"
              option={trendOption}
              empty={dailyTrend.every((item) => item.rate === null)}
            />
          </Col>

          <Col xs={24} lg={12}>
            <ChartCard
              title="检测结果分布"
              option={resultOption}
              empty={statistics.total === 0}
            />
          </Col>
        </Row>

        {/* 第二排图表 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <ChartCard
              title="各物料类型不合格数量"
              option={materialOption}
              empty={materialFailures.length === 0}
            />
          </Col>

          <Col xs={24} lg={12}>
            <ChartCard title="客户投诉分类（演示数据）" option={feedbackOption} />
          </Col>
        </Row>
      </Spin>
    </div>
  )
}
