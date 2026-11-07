import { Profiler, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Statistic,
  Typography,
} from 'antd'

import VirtualDetectionTable from '../components/VirtualDetectionTable'
import { generateDetections } from '../utils/generateDetections'
import type { DetectionRecord } from '../types/detection'
import '../styles/virtualList.css'

type ListMode = 'normal' | 'virtual'

interface ScrollResult {
  fps: number
  slowFrames: number
  totalFrames: number
}

// 普通列表：直接创建所有数据行
function NormalTable({
  data,
  setScroller,
}: {
  data: DetectionRecord[]
  setScroller: (node: HTMLElement | null) => void
}) {
  return (
    <div className="normal-list-scroll" ref={setScroller}>
      <table className="performance-table">
        <thead>
          <tr>
            <th>检测编号</th>
            <th>物料名称</th>
            <th>物料类型</th>
            <th>检测人员</th>
            <th>检测日期</th>
            <th>检测结果</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.id} data-measure-row="true">
              <td>{item.id}</td>
              <td>{item.materialName}</td>
              <td>{item.materialType}</td>
              <td>{item.inspector}</td>
              <td>{item.date}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function VirtualList() {
  const [mode, setMode] = useState<ListMode>('virtual')
  const [count, setCount] = useState(10000)

  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<string | undefined>()

  // 性能统计结果
  const [domRows, setDomRows] = useState(0)
  const [renderMs, setRenderMs] = useState<number | null>(null)
  const [scrollResult, setScrollResult] = useState<ScrollResult | null>(null)
  const [testing, setTesting] = useState(false)

  // 保存当前列表真正的滚动容器
  const scrollRef = useRef<HTMLElement | null>(null)
  // 专门用于统计列表 DOM，不依赖滚动容器
  const listContainerRef = useRef<HTMLDivElement | null>(null)
  // 强制重新挂载列表，用于重新测量
  const [runId, setRunId] = useState(0)

  // 保证只有数据量变化时才重新生成数据
  const allData = useMemo(() => generateDetections(count), [count])

  // 关键词和状态组合筛选
  const filteredData = useMemo(() => {
    return allData.filter((item) => {
      const text = keyword.trim().toLowerCase()

      const matchKeyword =
        !text ||
        item.id.toLowerCase().includes(text) ||
        item.materialName.toLowerCase().includes(text)

      const matchStatus = !status || item.status === status

      return matchKeyword && matchStatus
    })
  }, [allData, keyword, status])

  // 普通表格与虚拟表格共用滚动容器引用
  const setScroller = useCallback((node: HTMLElement | null) => {
    scrollRef.current = node
  }, [])

  // React Profiler：记录本次挂载的 React 渲染耗时
  const handleRender = useCallback(
    (
      _id: string,
      phase: 'mount' | 'update' | 'nested-update',
      actualDuration: number,
    ) => {
      if (phase === 'mount') {
        setRenderMs(Number(actualDuration.toFixed(2)))
      }
    },
    [],
  )

  // 列表变化后，统计实际存在的 DOM 数据行

  // 监听列表 DOM 变化，统计真正渲染的数据行
  useEffect(() => {
    const container = listContainerRef.current
    if (!container) return

    const measureRows = () => {
      const rows = container.querySelectorAll('tr[data-measure-row="true"]')

      setDomRows((prev) => (prev === rows.length ? prev : rows.length))
    }

    // 首次统计
    measureRows()

    // 虚拟列表完成布局后可能继续添加数据行
    const observer = new MutationObserver(measureRows)

    observer.observe(container, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [mode, count, runId, filteredData])

  // 手动重新测量：强制重新挂载列表组件
  const handleRemeasure = () => {
    setRenderMs(null)
    setScrollResult(null)
    setRunId((prev) => prev + 1)
  }

  // 自动滚动测试：持续 2 秒，记录 rAF 帧间隔
  const runScrollTest = () => {
    const scroller = scrollRef.current
    if (!scroller || testing) return

    setTesting(true)
    setScrollResult(null)

    const maxScroll = scroller.scrollHeight - scroller.clientHeight

    const duration = 2000
    let startTime = 0
    let lastTime = 0
    let slowFrames = 0
    let totalFrames = 0

    const step = (timestamp: number) => {
      if (startTime === 0) {
        startTime = timestamp
        lastTime = timestamp
      } else {
        const delta = timestamp - lastTime
        lastTime = timestamp

        totalFrames++

        // 大于 20ms 记为一个较慢的帧间隔
        if (delta > 20) {
          slowFrames++
        }
      }

      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)

      // 模拟从顶部匀速滚动到列表底部
      scroller.scrollTop = maxScroll * progress

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        const fps = elapsed > 0 ? totalFrames / (elapsed / 1000) : 0

        setScrollResult({
          fps: Number(fps.toFixed(1)),
          slowFrames,
          totalFrames,
        })

        setTesting(false)
      }
    }

    scroller.scrollTop = 0
    requestAnimationFrame(step)
  }

  return (
    <div>
      <Typography.Title level={3}>大数据检测明细</Typography.Title>

      <Typography.Paragraph type="secondary">
        通过普通列表与 react-virtuoso 虚拟列表对比， 观察万级数据下的 DOM 数量和渲染性能。
      </Typography.Paragraph>

      <Alert
        type="info"
        showIcon
        title="性能测试说明"
        description="普通列表会一次性渲染全部行。切换到 10000 条普通列表时可能出现短暂卡顿，请先用 1000 条进行对比。"
        style={{ marginBottom: 16 }}
      />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Radio.Group
            value={mode}
            optionType="button"
            buttonStyle="solid"
            onChange={(e) => {
              setMode(e.target.value)
              setScrollResult(null)
            }}
            options={[
              { label: '普通列表', value: 'normal' },
              { label: '虚拟列表', value: 'virtual' },
            ]}
          />

          <Select
            value={count}
            style={{ width: 150 }}
            onChange={(value) => {
              setCount(value)
              setScrollResult(null)
            }}
            options={[
              { label: '1000 条', value: 1000 },
              { label: '10000 条', value: 10000 },
            ]}
          />

          <Input.Search
            placeholder="搜索编号或物料"
            style={{ width: 200 }}
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <Select
            placeholder="检测状态"
            allowClear
            style={{ width: 140 }}
            value={status}
            onChange={setStatus}
            options={[
              { label: '合格', value: '合格' },
              { label: '不合格', value: '不合格' },
              { label: '待检测', value: '待检测' },
            ]}
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="筛选后数据总量" value={filteredData.length} suffix="条" />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="实际 DOM 数据行" value={domRows} suffix="行" />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="React 挂载渲染耗时"
              value={renderMs ?? 0}
              precision={2}
              suffix="ms"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={mode === 'virtual' ? '虚拟列表（react-virtuoso）' : '普通列表（全部渲染）'}
        extra={
          <Space>
            <Button onClick={handleRemeasure} disabled={testing}>
              重新测量
            </Button>

            <Button type="primary" loading={testing} onClick={runScrollTest}>
              自动滚动测试
            </Button>
          </Space>
        }
      >
        <div ref={listContainerRef}>
          <Profiler
            key={`${mode}-${count}-${runId}`}
            id="DetectionList"
            onRender={handleRender}
          >
            {mode === 'virtual' ? (
              <VirtualDetectionTable data={filteredData} scrollRef={scrollRef} />
            ) : (
              <NormalTable data={filteredData} setScroller={setScroller} />
            )}
          </Profiler>
        </div>

        {scrollResult && (
          <Card size="small" title="滚动测试结果" style={{ marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="近似 rAF 频率"
                  value={scrollResult.fps}
                  suffix="次/秒"
                />
              </Col>

              <Col span={8}>
                <Statistic title="慢帧间隔（>20ms）" value={scrollResult.slowFrames} />
              </Col>

              <Col span={8}>
                <Statistic title="采样帧间隔数" value={scrollResult.totalFrames} />
              </Col>
            </Row>
          </Card>
        )}
      </Card>
    </div>
  )
}
