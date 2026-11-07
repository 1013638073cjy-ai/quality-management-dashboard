import type { DetectionRecord, DetectionFormValues } from '../types/detection'

const STORAGE_KEY = 'quality-management-detections'

// 用于首次进入页面时显示的模拟数据
const initialData: DetectionRecord[] = [
  {
    id: 'JC2026001',
    materialName: '钢板 A',
    materialType: '金属材料',
    inspector: '张工',
    date: '2026-11-01',
    status: '合格',
    remark: '检测指标正常',
  },
  {
    id: 'JC2026002',
    materialName: '塑料外壳 B',
    materialType: '塑料材料',
    inspector: '李工',
    date: '2026-11-02',
    status: '不合格',
    remark: '外观存在划痕',
  },
  {
    id: 'JC2026003',
    materialName: '电子元件 C',
    materialType: '电子元件',
    inspector: '王工',
    date: '2026-11-03',
    status: '待检测',
    remark: '等待检测安排',
  },
  {
    id: 'JC2026004',
    materialName: '铝合金 D',
    materialType: '金属材料',
    inspector: '张工',
    date: '2026-11-04',
    status: '合格',
    remark: '尺寸符合要求',
  },
  {
    id: 'JC2026005',
    materialName: '连接器 E',
    materialType: '电子元件',
    inspector: '李工',
    date: '2026-11-05',
    status: '合格',
    remark: '电气性能正常',
  },
  {
    id: 'JC2026006',
    materialName: '包装材料 F',
    materialType: '包装材料',
    inspector: '王工',
    date: '2026-11-06',
    status: '不合格',
    remark: '部分包装破损',
  },
]

// 从 localStorage 读取检测记录
export function getDetections(): DetectionRecord[] {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (stored !== null) {
    try {
      const parsed: unknown = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        return parsed as DetectionRecord[]
      }
    } catch {
      console.warn('本地检测数据解析失败，将恢复初始数据')
    }
  }

  // 首次访问时写入初始数据
  saveDetections(initialData)
  return initialData
}

// 保存检测记录
export function saveDetections(data: DetectionRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// 创建新记录，使用随机 UUID 保证记录身份唯一
export function createDetection(values: DetectionFormValues): DetectionRecord {
  return {
    ...values,
    id: crypto.randomUUID(),
  }
}
