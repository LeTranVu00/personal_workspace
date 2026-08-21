export type WorkflowTemplateKey = 'project' | 'content' | 'study'

export interface WorkflowTemplate {
  key: WorkflowTemplateKey
  label: string
  description: string
  steps: string[]
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    key: 'project',
    label: 'Project flow',
    description: 'Từ ý tưởng đến hoàn thành',
    steps: ['Ý tưởng', 'Lên kế hoạch', 'Đang thực hiện', 'Kiểm tra', 'Hoàn thành'],
  },
  {
    key: 'content',
    label: 'Content flow',
    description: 'Quy trình tạo nội dung',
    steps: ['Ý tưởng nội dung', 'Nghiên cứu', 'Bản nháp', 'Biên tập', 'Xuất bản'],
  },
  {
    key: 'study',
    label: 'Study flow',
    description: 'Quy trình học tập',
    steps: ['Mục tiêu học', 'Tài liệu', 'Ghi chú', 'Ôn tập', 'Đánh giá'],
  },
]
