import request from '../utils/request'
import type { ApiResponse } from '../utils/request'
import type { DetectionRecord, DetectionFormValues } from '../types/detection'

// GET：获取检测记录列表
export async function getDetectionList() {
  const response = await request.get<ApiResponse<DetectionRecord[]>>('/detections')

  return response.data.data
}

// POST：新增检测记录
export async function addDetection(values: DetectionFormValues) {
  const response = await request.post<ApiResponse<DetectionRecord>>('/detections', values)

  return response.data.data
}

// PUT：修改检测记录
export async function editDetection(id: string, values: DetectionFormValues) {
  const response = await request.put<ApiResponse<DetectionRecord>>(
    `/detections/${encodeURIComponent(id)}`,
    values,
  )

  return response.data.data
}

// DELETE：删除检测记录
export async function deleteDetection(id: string) {
  await request.delete(`/detections/${encodeURIComponent(id)}`)
}
