import { TableVirtuoso } from 'react-virtuoso'
import type { DetectionRecord } from '../types/detection'
import type { RefObject } from 'react'
import '../styles/virtualList.css'

interface Props {
  data: DetectionRecord[]
  scrollRef: RefObject<HTMLElement | null>
}

// 定义稳定的表格行组件，方便统计实际渲染的 DOM 行数
function VirtualRow(props: React.ComponentPropsWithRef<'tr'>) {
  return <tr {...props} data-measure-row="true" />
}
function VirtualTable(props: React.ComponentPropsWithRef<'table'>) {
  return <table {...props} className="performance-table" />
}
// 表头和普通表格保持一致
function TableHeader() {
  return (
    <tr>
      <th>检测编号</th>
      <th>物料名称</th>
      <th>物料类型</th>
      <th>检测人员</th>
      <th>检测日期</th>
      <th>检测结果</th>
    </tr>
  )
}

export default function VirtualDetectionTable({ data, scrollRef }: Props) {
  return (
    <TableVirtuoso
      style={{ height: 450 }}
      data={data}
      computeItemKey={(_, item) => item.id}
      components={{
        TableRow: VirtualRow,
        Table: VirtualTable,
      }}
      scrollerRef={(element) => {
        scrollRef.current = element instanceof HTMLElement ? element : null
      }}
      fixedHeaderContent={TableHeader}
      itemContent={(_, item) => (
        <>
          <td>{item.id}</td>
          <td>{item.materialName}</td>
          <td>{item.materialType}</td>
          <td>{item.inspector}</td>
          <td>{item.date}</td>
          <td>
            <span
              className={
                item.status === '合格'
                  ? 'status-success'
                  : item.status === '不合格'
                    ? 'status-error'
                    : 'status-warning'
              }
            >
              {item.status}
            </span>
          </td>
        </>
      )}
    />
  )
}
