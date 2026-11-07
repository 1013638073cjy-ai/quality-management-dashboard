import { useEffect, useRef } from 'react'
import { Card, Empty } from 'antd'

import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

import type { EChartsOption } from 'echarts'
import type { EChartsType } from 'echarts/core'

// 只注册当前项目用到的 ECharts 功能
echarts.use([
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
])

interface ChartCardProps {
  title: string
  option: EChartsOption
  empty?: boolean
  height?: number
}

export default function ChartCard({
  title,
  option,
  empty = false,
  height = 320,
}: ChartCardProps) {
  // 获取图表对应的 DOM 容器
  const chartRef = useRef<HTMLDivElement>(null)

  // 保存 ECharts 实例，避免重复创建
  const instanceRef = useRef<EChartsType | null>(null)

  // 1. 创建图表实例，并在卸载时销毁
  useEffect(() => {
    if (empty || !chartRef.current) return

    const chart = echarts.init(chartRef.current)
    instanceRef.current = chart

    // 当容器尺寸变化时，重新计算图表大小
    const observer = new ResizeObserver(() => {
      chart.resize()
    })

    observer.observe(chartRef.current)

    return () => {
      observer.disconnect()
      chart.dispose()
      instanceRef.current = null
    }
  }, [empty])

  // 2. 数据或筛选条件变化时，只更新配置
  useEffect(() => {
    if (empty || !instanceRef.current) return

    instanceRef.current.setOption(option, {
      notMerge: true,
      lazyUpdate: true,
    })
  }, [option, empty])

  return (
    <Card title={title} style={{ height: '100%' }}>
      {empty ? (
        <Empty description="暂无统计数据" style={{ height, paddingTop: 80 }} />
      ) : (
        <div
          ref={chartRef}
          style={{
            width: '100%',
            height,
          }}
        />
      )}
    </Card>
  )
}
