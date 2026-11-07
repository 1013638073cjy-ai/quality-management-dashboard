// 客户反馈分类演示数据
// 后续可以替换成 Express 客户反馈 API

export interface FeedbackCategory {
  category: string
  count: number
}

export const feedbackMock: FeedbackCategory[] = [
  { category: '产品外观', count: 26 },
  { category: '功能异常', count: 18 },
  { category: '包装破损', count: 14 },
  { category: '物流问题', count: 11 },
  { category: '其他问题', count: 6 },
]
