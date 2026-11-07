import { Form, Input, Select, DatePicker } from 'antd'
import dayjs from 'dayjs'
import type { FormInstance } from 'antd'
import type { DetectionFormValues } from '../types/detection'

const { TextArea } = Input

interface Props {
  form: FormInstance<DetectionFormValues>
}

// 表单字段与 DetectionFormValues 对应
export default function DetectionForm({ form }: Props) {
  return (
    <Form form={form} layout="vertical" initialValues={{ status: '待检测' }}>
      <Form.Item
        name="materialName"
        label="物料名称"
        rules={[{ required: true, message: '请输入物料名称' }]}
      >
        <Input placeholder="例如：钢板 A" maxLength={50} />
      </Form.Item>

      <Form.Item
        name="materialType"
        label="物料类型"
        rules={[{ required: true, message: '请选择物料类型' }]}
      >
        <Select
          placeholder="请选择物料类型"
          options={[
            { label: '金属材料', value: '金属材料' },
            { label: '塑料材料', value: '塑料材料' },
            { label: '电子元件', value: '电子元件' },
            { label: '包装材料', value: '包装材料' },
          ]}
        />
      </Form.Item>

      <Form.Item
        name="inspector"
        label="检测人员"
        rules={[{ required: true, message: '请输入检测人员' }]}
      >
        <Input placeholder="例如：张工" />
      </Form.Item>

      <Form.Item
        name="date"
        label="检测日期"
        getValueProps={(value?: string) => ({
          value: value ? dayjs(value) : null,
        })}
        normalize={(value: dayjs.Dayjs | null) => value?.format('YYYY-MM-DD')}
        rules={[{ required: true, message: '请选择检测日期' }]}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="status"
        label="检测结果"
        rules={[{ required: true, message: '请选择检测结果' }]}
      >
        <Select
          options={[
            { label: '合格', value: '合格' },
            { label: '不合格', value: '不合格' },
            { label: '待检测', value: '待检测' },
          ]}
        />
      </Form.Item>

      <Form.Item name="remark" label="检测备注">
        <TextArea rows={3} placeholder="请输入检测备注" />
      </Form.Item>
    </Form>
  )
}
