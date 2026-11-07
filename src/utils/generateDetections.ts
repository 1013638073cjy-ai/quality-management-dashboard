import type { DetectionRecord } from '../types/detection'

// 模拟业务字段
const materialNames = [
  '钢板 A',
  '塑料外壳 B',
  '电子元件 C',
  '铝合金 D',
  '连接器 E',
  '包装材料 F',
]

const materialTypes = [
  '金属材料',
  '塑料材料',
  '电子元件',
  '金属材料',
  '电子元件',
  '包装材料',
]

const inspectors = ['张工', '李工', '王工', '陈工', '刘工']

const statuses: DetectionRecord['status'][] = ['合格', '合格', '合格', '不合格', '待检测']

// 生成指定数量的检测记录
export function generateDetections(count: number): DetectionRecord[] {
  // 使用固定规则生成数据，保证不同测试使用相同数据
  const startDate = new Date('2026-01-01T00:00:00')

  return Array.from({ length: count }, (_, index) => {
    const materialIndex = index % materialNames.length
    const date = new Date(startDate)

    date.setDate(startDate.getDate() + (index % 300))

    return {
      id: `JC${String(index + 1).padStart(8, '0')}`,
      materialName: materialNames[materialIndex],
      materialType: materialTypes[materialIndex],
      inspector: inspectors[index % inspectors.length],
      date: [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-'),
      status: statuses[index % statuses.length],
      remark: `第 ${index + 1} 条物料检测明细`,
    }
  })
}
