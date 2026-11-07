/**
 * 检测结果
 * 使用联合类型限制字段只能填写这三种状态
 */
export type DetectionStatus = '合格' | '不合格' | '待检测'

// 一条物料检测记录的数据结构
export interface DetectionRecord {
  id: string
  materialName: string
  materialType: string
  inspector: string
  date: string
  status: DetectionStatus
  remark: string
}

// 新增记录时，不需要手动输入 id
export type DetectionFormValues = Omit<DetectionRecord, 'id'>
