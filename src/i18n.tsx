import { useState, type ReactNode } from 'react'
import { LanguageContext } from './i18nContext'

export type Language = 'vi' | 'en'

export type TranslationKey =
  | 'app.name'
  | 'app.subtitle'
  | 'home.title'
  | 'home.createWorkspace'
  | 'home.emptyTitle'
  | 'home.emptyDescription'
  | 'home.recentPages'
  | 'workspace.label'
  | 'workspace.section'
  | 'workspace.create'
  | 'workspace.search'
  | 'workspace.noResults'
  | 'workspace.none'
  | 'workspace.editDescription'
  | 'workspace.createDescription'
  | 'workspace.placeholder'
  | 'workspace.nameHint'
  | 'settings'
  | 'language'
  | 'language.description'
  | 'vietnamese'
  | 'english'
  | 'search.workspace'
  | 'search.workspaceContent'
  | 'search.noResults'
  | 'search.results'
  | 'search.tryDifferent'
  | 'filter.title'
  | 'filter.all'
  | 'filter.status'
  | 'filter.priority'
  | 'filter.tag'
  | 'filter.active'
  | 'filter.doing'
  | 'filter.done'
  | 'filter.archived'
  | 'filter.high'
  | 'filter.normal'
  | 'filter.low'
  | 'filter.clear'
  | 'category.create'
  | 'category.none'
  | 'category.createHint'
  | 'category.createButton'
  | 'category.edit'
  | 'category.name'
  | 'category.placeholder'
  | 'category.deleteTitle'
  | 'category.deleteDescription'
  | 'page.create'
  | 'page.rename'
  | 'page.edit'
  | 'page.empty'
  | 'page.add'
  | 'page.pin'
  | 'page.unpin'
  | 'page.pinned'
  | 'page.archive'
  | 'page.restore'
  | 'page.start'
  | 'page.done'
  | 'page.active'
  | 'page.related'
  | 'page.noTitle'
  | 'page.untitled'
  | 'page.deadline'
  | 'page.emptyContent'
  | 'page.addFirstBlock'
  | 'page.title'
  | 'page.placeholder'
  | 'page.createButton'
  | 'page.templates'
  | 'page.workflows'
  | 'page.deleteTitle'
  | 'page.deleteDescription'
  | 'page.bulkDeleteTitle'
  | 'page.bulkDeleteDescription'
  | 'page.type.note'
  | 'page.type.task'
  | 'page.type.list'
  | 'page.quickActions'
  | 'page.tags'
  | 'page.addRelation'
  | 'page.removeRelation'
  | 'page.noRelatedPages'
  | 'page.quickAddText'
  | 'page.deleteBlock'
  | 'page.deleteBlockDescription'
  | 'overview.label'
  | 'overview.items'
  | 'overview.tasks'
  | 'overview.done'
  | 'overview.notes'
  | 'overview.overdue'
  | 'overview.totalPages'
  | 'overview.inProgress'
  | 'overview.completed'
  | 'overview.taskCompletion'
  | 'overview.scheduled'
  | 'overview.workflowHealth'
  | 'overview.workflowDescription'
  | 'overview.scheduledDescription'
  | 'overview.doingDescription'
  | 'overview.pinnedFocus'
  | 'overview.todayFocus'
  | 'overview.recentItems'
  | 'overview.quickTags'
  | 'overview.priority'
  | 'overview.latest'
  | 'overview.focus'
  | 'overview.noPinned'
  | 'overview.noFocus'
  | 'overview.noPages'
  | 'overview.noTags'
  | 'overview.urgent'
  | 'overview.next'
  | 'overview.kanban'
  | 'overview.noWork'
  | 'overview.overview'
  | 'overview.doing'
  | 'overview.active'
  | 'overview.completedTasks'
  | 'overview.general'
  | 'backup.title'
  | 'backup.description'
  | 'backup.export'
  | 'backup.exportDescription'
  | 'backup.import'
  | 'backup.importDescription'
  | 'backup.exported'
  | 'backup.exportError'
  | 'backup.importError'
  | 'backup.confirm'
  | 'common.cancel'
  | 'common.save'
  | 'common.saving'
  | 'common.delete'
  | 'common.deleting'
  | 'common.rename'
  | 'common.close'
  | 'common.select'
  | 'common.clearSelection'
  | 'common.selected'
  | 'common.menu'
  | 'common.workspace'
  | 'common.search'
  | 'common.new'
  | 'common.clear'
  | 'common.more'
  | 'common.archive'
  | 'common.pin'
  | 'common.moveTo'
  | 'common.deleteSelected'
  | 'common.expand'
  | 'common.collapse'
  | 'common.deselect'
  | 'common.unpin'
  | 'common.items'
  | 'common.pinned'
  | 'common.steps'
  | 'common.open'
  | 'common.remove'
  | 'common.addItem'
  | 'common.pressEsc'
  | 'common.irreversible'
  | 'common.bold'
  | 'common.italic'
  | 'common.underline'
  | 'common.strikethrough'
  | 'common.fontSize'
  | 'table.resizeHint'
  | 'table.rows'
  | 'table.columns'
  | 'notification.open'
  | 'notification.title'
  | 'notification.description'
  | 'notification.empty'
  | 'notification.overdue'
  | 'notification.upcoming'
  | 'notification.overdueTitle'
  | 'notification.upcomingTitle'
  | 'notification.markRead'
  | 'notification.enable'
  | 'notification.reminder'
  | 'notification.reminderDescription'
  | 'notification.enableForPage'
  | 'notification.reminderTime'
  | 'notification.open'
  | 'notification.title'
  | 'notification.description'
  | 'notification.empty'
  | 'notification.overdue'
  | 'notification.upcoming'
  | 'notification.overdueTitle'
  | 'notification.upcomingTitle'
  | 'notification.markRead'
  | 'notification.enable'

const dictionary: Record<Language, Record<TranslationKey, string>> = {
  vi: {
    'app.name': 'Personal Workspace',
    'app.subtitle': 'Journey Log',
    'home.title': 'Trang chủ',
    'home.createWorkspace': 'Tạo Workspace',
    'home.emptyTitle': 'Tạo Workspace đầu tiên',
    'home.emptyDescription': 'Tạo Workspace đầu tiên để bắt đầu quản lý học tập, công việc và hành trình của bạn.',
    'home.recentPages': 'Page gần đây',
    'workspace.label': 'Workspace',
    'workspace.section': 'Workspace',
    'workspace.create': 'Tạo Workspace mới',
    'workspace.search': 'Tìm Workspace...',
    'workspace.noResults': 'Không tìm thấy.',
    'workspace.none': 'Chưa có Workspace nào.',
    'workspace.editDescription': 'Đổi tên workspace của bạn',
    'workspace.createDescription': 'Tạo workspace mới để tổ chức công việc',
    'workspace.placeholder': 'Ví dụ: Học tập, Công việc, Cá nhân...',
    'workspace.nameHint': 'Dùng tên ngắn gọn, dễ nhớ',
    'settings': 'Cài đặt',
    'language': 'Ngôn ngữ',
    'language.description': 'Chọn ngôn ngữ hiển thị cho ứng dụng',
    'vietnamese': 'Tiếng Việt',
    'english': 'English',
    'search.workspace': 'Tìm kiếm trong workspace...',
    'search.workspaceContent': 'Kết quả tìm kiếm',
    'search.noResults': 'Không tìm thấy kết quả phù hợp.',
    'search.results': 'Kết quả tìm kiếm',
    'search.tryDifferent': 'Thử từ khóa khác',
    'filter.title': 'Bộ lọc',
    'filter.all': 'Tất cả',
    'filter.status': 'Trạng thái',
    'filter.priority': 'Độ ưu tiên',
    'filter.tag': 'Tag',
    'filter.active': 'Đang làm',
    'filter.doing': 'Đang thực hiện',
    'filter.done': 'Hoàn thành',
    'filter.archived': 'Đã lưu trữ',
    'filter.high': 'Cao',
    'filter.normal': 'Bình thường',
    'filter.low': 'Thấp',
    'filter.clear': 'Xóa bộ lọc',
    'category.create': 'Tạo danh mục',
    'category.none': 'Chưa có danh mục',
    'category.createHint': 'Tạo danh mục để tổ chức Pages',
    'category.createButton': 'Tạo danh mục',
    'category.edit': 'Đổi tên danh mục',
    'category.name': 'Tên danh mục',
    'category.placeholder': 'Ví dụ: Công việc',
    'category.deleteTitle': 'Xóa danh mục?',
    'category.deleteDescription': 'Danh mục "{name}" và toàn bộ Page bên trong sẽ bị xóa vĩnh viễn.',
    'page.create': 'Tạo Page',
    'page.rename': 'Đổi tên Page',
    'page.edit': 'Đổi tên Page',
    'page.empty': 'Page đang trống',
    'page.add': 'Thêm Page',
    'page.pin': 'Ghim',
    'page.unpin': 'Bỏ ghim',
    'page.pinned': 'Đã ghim',
    'page.archive': 'Lưu trữ',
    'page.restore': 'Khôi phục',
    'page.start': 'Bắt đầu',
    'page.done': 'Hoàn thành',
    'page.active': 'Đang làm',
    'page.related': 'Page liên quan',
    'page.noTitle': 'Trang không có tiêu đề',
    'page.untitled': 'Trang không có tiêu đề',
    'page.deadline': 'Deadline',
    'page.emptyContent': 'Page đang trống',
    'page.addFirstBlock': 'Thêm block đầu tiên để bắt đầu ghi nội dung',
    'page.title': 'Tên Page',
    'page.placeholder': 'Ví dụ: Công việc hôm nay',
    'page.createButton': 'Tạo Page',
    'page.templates': 'Mẫu Page',
    'page.workflows': 'Mẫu workflow',
    'page.deleteTitle': 'Xóa Page?',
    'page.deleteDescription': 'Page "{title}" và toàn bộ nội dung bên trong sẽ bị xóa vĩnh viễn.',
    'page.bulkDeleteTitle': 'Xóa các Page đã chọn?',
    'page.bulkDeleteDescription': '{count} Page và toàn bộ nội dung bên trong sẽ bị xóa.',
    'page.type.note': 'Ghi chú',
    'page.type.task': 'Công việc',
    'page.type.list': 'Danh sách',
    'page.quickActions': 'Thao tác nhanh',
    'page.tags': 'Tags',
    'page.addRelation': 'Thêm page liên quan',
    'page.removeRelation': 'Xóa liên kết',
    'page.noRelatedPages': 'Không có page liên quan',
    'page.quickAddText': 'Thêm nhanh văn bản',
    'page.deleteBlock': 'Xóa nội dung?',
    'page.deleteBlockDescription': 'Block này sẽ bị xóa khỏi Page. Hành động không thể hoàn tác.',
    'overview.label': 'Tổng quan Workspace',
    'overview.items': 'Mục',
    'overview.tasks': 'Tasks',
    'overview.done': 'Hoàn thành',
    'overview.notes': 'Ghi chú',
    'overview.overdue': 'Quá hạn',
    'overview.totalPages': 'Tổng số page',
    'overview.inProgress': 'Đang xử lý',
    'overview.completed': 'Hoàn thành',
    'overview.taskCompletion': 'Tỷ lệ hoàn thành task',
    'overview.scheduled': 'Có lịch',
    'overview.workflowHealth': 'Sức khỏe workflow',
    'overview.workflowDescription': 'Tổng quan nhanh về nhịp làm việc hiện tại.',
    'overview.scheduledDescription': 'Task có deadline',
    'overview.doingDescription': 'Task đang thực hiện',
    'overview.pinnedFocus': 'Mục đã ghim',
    'overview.todayFocus': 'Tập trung hôm nay',
    'overview.recentItems': 'Mục gần đây',
    'overview.quickTags': 'Tag nhanh',
    'overview.priority': 'Ưu tiên',
    'overview.latest': 'Mới nhất',
    'overview.focus': 'Tập trung',
    'overview.noPinned': 'Chưa ghim mục nào.',
    'overview.noFocus': 'Không có task ưu tiên hôm nay.',
    'overview.noPages': 'Chưa có page nào trong workspace này.',
    'overview.noTags': 'Chưa có tag nào',
    'overview.urgent': 'Khẩn cấp',
    'overview.next': 'Tiếp theo',
    'overview.kanban': 'Kanban',
    'overview.noWork': 'Không có việc nào',
    'notification.open': 'Mở thông báo',
    'notification.title': 'Thông báo',
    'notification.description': 'Nhắc việc và deadline gần đến.',
    'notification.empty': 'Không có thông báo mới.',
    'notification.overdue': 'Đã quá hạn',
    'notification.upcoming': 'Sắp đến hạn',
    'notification.overdueTitle': 'Task đã quá hạn',
    'notification.upcomingTitle': 'Task sắp đến hạn',
    'notification.markRead': 'Đánh dấu đã đọc',
    'notification.enable': 'Bật thông báo thiết bị',
    'notification.reminder': 'Nhắc thông báo',
    'notification.reminderDescription': 'Cài thời điểm nhắc riêng cho Page này.',
    'notification.enableForPage': 'Bật nhắc cho Page này',
    'notification.reminderTime': 'Thời điểm nhắc',
    'overview.overview': 'Tổng quan',
    'overview.doing': 'Đang làm',
    'overview.active': 'Chưa bắt đầu',
    'overview.completedTasks': 'task đã hoàn thành',
    'overview.general': 'Chung',
    'backup.title': 'Backup dữ liệu',
    'backup.description': 'Xuất hoặc khôi phục toàn bộ dữ liệu local.',
    'backup.export': 'Export JSON',
    'backup.exportDescription': 'Tải toàn bộ workspace, page và block.',
    'backup.import': 'Import JSON',
    'backup.importDescription': 'Thay thế dữ liệu hiện tại bằng file backup.',
    'backup.exported': 'Đã tải file backup xuống thiết bị.',
    'backup.exportError': 'Không thể tạo file backup.',
    'backup.importError': 'Không thể khôi phục file backup.',
    'backup.confirm': 'Import sẽ thay thế toàn bộ dữ liệu hiện tại. Bạn có muốn tiếp tục không?',
    'common.cancel': 'Hủy',
    'common.save': 'Lưu',
    'common.saving': 'Đang lưu...',
    'common.delete': 'Xóa',
    'common.deleting': 'Đang xóa...',
    'common.rename': 'Đổi tên',
    'common.close': 'Đóng',
    'common.select': 'Chọn',
    'common.clearSelection': 'Bỏ chọn',
    'common.selected': 'đã chọn',
    'common.menu': 'Mở menu',
    'common.workspace': 'Workspace',
    'common.search': 'Tìm kiếm',
    'common.new': 'Mới',
    'common.clear': 'Xóa',
    'common.more': 'Thêm tùy chọn',
    'common.archive': 'Lưu trữ / Khôi phục',
    'common.pin': 'Ghim / Bỏ ghim',
    'common.moveTo': 'Chuyển đến',
    'common.deleteSelected': 'Xóa mục đã chọn',
    'common.expand': 'Mở rộng',
    'common.collapse': 'Thu gọn',
    'common.deselect': 'Bỏ chọn',
    'common.unpin': 'Bỏ ghim',
    'common.items': 'mục',
    'common.pinned': 'Đã ghim',
    'common.steps': 'bước',
    'common.open': 'Mở',
    'common.remove': 'Xóa',
    'common.addItem': 'Thêm mục',
    'common.pressEsc': 'Nhấn Esc để đóng',
    'common.irreversible': 'Hành động này không thể hoàn tác.',
    'common.bold': 'In đậm',
    'common.italic': 'In nghiêng',
    'common.underline': 'Gạch chân',
    'common.strikethrough': 'Gạch ngang',
    'common.fontSize': 'Cỡ chữ',
    'table.resizeHint': 'Kéo để thay đổi kích thước • Double-click để tự động',
    'table.rows': 'hàng',
    'table.columns': 'cột',
  },
  en: {
    'app.name': 'Personal Workspace',
    'app.subtitle': 'Journey Log',
    'home.title': 'Home',
    'home.createWorkspace': 'Create Workspace',
    'home.emptyTitle': 'Create your first Workspace',
    'home.emptyDescription': 'Create your first Workspace to manage learning, work, and your journey.',
    'home.recentPages': 'Recent pages',
    'workspace.label': 'Workspace',
    'workspace.section': 'Workspaces',
    'workspace.create': 'Create Workspace',
    'workspace.search': 'Search workspaces...',
    'workspace.noResults': 'No results.',
    'workspace.none': 'No workspaces yet.',
    'workspace.editDescription': 'Rename your workspace',
    'workspace.createDescription': 'Create a new workspace to organize your work',
    'workspace.placeholder': 'e.g., Learning, Work, Personal...',
    'workspace.nameHint': 'Use a short, memorable name',
    'settings': 'Settings',
    'language': 'Language',
    'language.description': 'Choose your preferred language',
    'vietnamese': 'Vietnamese',
    'english': 'English',
    'search.workspace': 'Search this workspace...',
    'search.workspaceContent': 'Search results',
    'search.noResults': 'No matching results.',
    'search.results': 'Search results',
    'search.tryDifferent': 'Try a different search term',
    'filter.title': 'Filters',
    'filter.all': 'All',
    'filter.status': 'Status',
    'filter.priority': 'Priority',
    'filter.tag': 'Tag',
    'filter.active': 'Active',
    'filter.doing': 'Doing',
    'filter.done': 'Done',
    'filter.archived': 'Archived',
    'filter.high': 'High',
    'filter.normal': 'Normal',
    'filter.low': 'Low',
    'filter.clear': 'Clear filters',
    'category.create': 'Create category',
    'category.none': 'No categories yet',
    'category.createHint': 'Create a category to organize Pages',
    'category.createButton': 'Create category',
    'category.edit': 'Rename category',
    'category.name': 'Category name',
    'category.placeholder': 'Example: Work',
    'category.deleteTitle': 'Delete category?',
    'category.deleteDescription': 'Category "{name}" and all Pages inside it will be permanently deleted.',
    'page.create': 'Create Page',
    'page.rename': 'Rename Page',
    'page.edit': 'Rename Page',
    'page.empty': 'Page is empty',
    'page.add': 'Add Page',
    'page.pin': 'Pin',
    'page.unpin': 'Unpin',
    'page.pinned': 'Pinned',
    'page.archive': 'Archive',
    'page.restore': 'Restore',
    'page.start': 'Start',
    'page.done': 'Done',
    'page.active': 'Active',
    'page.related': 'Related pages',
    'page.noTitle': 'Untitled page',
    'page.untitled': 'Untitled page',
    'page.deadline': 'Deadline',
    'page.emptyContent': 'Page is empty',
    'page.addFirstBlock': 'Add the first block to start writing',
    'page.title': 'Page title',
    'page.placeholder': 'Example: Today\'s work',
    'page.createButton': 'Create Page',
    'page.templates': 'Page templates',
    'page.workflows': 'Workflow templates',
    'page.deleteTitle': 'Delete Page?',
    'page.deleteDescription': 'Page "{title}" and all content inside it will be permanently deleted.',
    'page.bulkDeleteTitle': 'Delete selected Pages?',
    'page.bulkDeleteDescription': '{count} Pages and all their content will be deleted.',
    'page.type.note': 'Note',
    'page.type.task': 'Task',
    'page.type.list': 'List',
    'page.quickActions': 'Quick actions',
    'page.tags': 'Tags',
    'page.addRelation': 'Add related page',
    'page.removeRelation': 'Remove relation',
    'page.noRelatedPages': 'No related pages',
    'page.quickAddText': 'Quick add text',
    'page.deleteBlock': 'Delete content?',
    'page.deleteBlockDescription': 'This block will be removed from the page. This action cannot be undone.',
    'overview.label': 'Workspace overview',
    'overview.items': 'Items',
    'overview.tasks': 'Tasks',
    'overview.done': 'Done',
    'overview.notes': 'Notes',
    'overview.overdue': 'Overdue',
    'overview.totalPages': 'Total pages',
    'overview.inProgress': 'In progress',
    'overview.completed': 'Completed',
    'overview.taskCompletion': 'Task completion',
    'overview.scheduled': 'Scheduled',
    'overview.workflowHealth': 'Workflow health',
    'overview.workflowDescription': 'A quick view of your current work rhythm.',
    'overview.scheduledDescription': 'Tasks with deadlines',
    'overview.doingDescription': 'Tasks in Doing',
    'overview.pinnedFocus': 'Pinned focus',
    'overview.todayFocus': 'Today focus',
    'overview.recentItems': 'Recent items',
    'overview.quickTags': 'Quick tags',
    'overview.priority': 'Priority',
    'overview.latest': 'Latest',
    'overview.focus': 'Focus',
    'overview.noPinned': 'Nothing pinned yet.',
    'overview.noFocus': 'No priority tasks for today.',
    'overview.noPages': 'No pages in this workspace yet.',
    'overview.noTags': 'No tags yet',
    'overview.urgent': 'Urgent',
    'overview.next': 'Next',
    'overview.kanban': 'Kanban',
    'overview.noWork': 'No work items',
    'notification.open': 'Open notifications',
    'notification.title': 'Notifications',
    'notification.description': 'Reminders and upcoming deadlines.',
    'notification.empty': 'No new notifications.',
    'notification.overdue': 'Overdue',
    'notification.upcoming': 'Due soon',
    'notification.overdueTitle': 'Overdue task',
    'notification.upcomingTitle': 'Task due soon',
    'notification.markRead': 'Mark as read',
    'notification.enable': 'Enable device notifications',
    'notification.reminder': 'Reminder',
    'notification.reminderDescription': 'Set a custom reminder time for this Page.',
    'notification.enableForPage': 'Enable reminder for this Page',
    'notification.reminderTime': 'Reminder time',
    'overview.overview': 'Overview',
    'overview.doing': 'Doing',
    'overview.active': 'Active',
    'overview.completedTasks': 'tasks completed',
    'overview.general': 'General',
    'backup.title': 'Data backup',
    'backup.description': 'Export or restore all local data.',
    'backup.export': 'Export JSON',
    'backup.exportDescription': 'Download all workspaces, pages, and blocks.',
    'backup.import': 'Import JSON',
    'backup.importDescription': 'Replace current data with a backup file.',
    'backup.exported': 'Backup file downloaded.',
    'backup.exportError': 'Could not create backup file.',
    'backup.importError': 'Could not restore backup file.',
    'backup.confirm': 'Import will replace all current data. Do you want to continue?',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.saving': 'Saving...',
    'common.delete': 'Delete',
    'common.deleting': 'Deleting...',
    'common.rename': 'Rename',
    'common.close': 'Close',
    'common.select': 'Select',
    'common.clearSelection': 'Clear selection',
    'common.selected': 'selected',
    'common.menu': 'Open menu',
    'common.workspace': 'Workspace',
    'common.search': 'Search',
    'common.new': 'New',
    'common.clear': 'Clear',
    'common.more': 'More options',
    'common.archive': 'Archive / Restore',
    'common.pin': 'Pin / Unpin',
    'common.moveTo': 'Move to',
    'common.deleteSelected': 'Delete selected',
    'common.expand': 'Expand',
    'common.collapse': 'Collapse',
    'common.deselect': 'Deselect',
    'common.unpin': 'Unpin',
    'common.items': 'items',
    'common.pinned': 'Pinned',
    'common.steps': 'steps',
    'common.open': 'Open',
    'common.remove': 'Remove',
    'common.addItem': 'Add item',
    'common.pressEsc': 'Press Esc to close',
    'common.irreversible': 'This action cannot be undone.',
    'common.bold': 'Bold',
    'common.italic': 'Italic',
    'common.underline': 'Underline',
    'common.strikethrough': 'Strikethrough',
    'common.fontSize': 'Font size',
    'table.resizeHint': 'Drag to resize • Double-click to auto',
    'table.rows': 'rows',
    'table.columns': 'columns',
  },
}

const englishText: Record<string, string> = {
  'Văn bản': 'Text',
  'Nội dung văn bản ngắn.': 'Short text content.',
  'Văn bản dài': 'Long text',
  'Nội dung nhiều dòng.': 'Multi-line content.',
  'Tiêu đề': 'Heading',
  'Tiêu đề cho nội dung.': 'A heading for your content.',
  'Ghi chú': 'Note',
  'Ghi chú nổi bật.': 'Highlighted note.',
  'Trích dẫn': 'Quote',
  'Một đoạn trích dẫn.': 'A quoted passage.',
  'Mã nguồn': 'Code',
  'Đoạn mã có định dạng.': 'Formatted code.',
  'Liên kết': 'Link',
  'Liên kết đến một URL.': 'A link to a URL.',
  'Bảng': 'Table',
  'Bảng dữ liệu tùy chỉnh.': 'A customizable data table.',
  'Chèn nội dung': 'Insert content',
  'Thêm nội dung': 'Add content',
  'Chọn loại nội dung': 'Choose content type',
  'Tiêu đề...': 'Heading...',
  'Nhập nội dung...': 'Enter content...',
  'Viết ghi chú...': 'Write a note...',
  'Nhập trích dẫn...': 'Enter a quote...',
  '// Mã nguồn...': '// Source code...',
  'Việc cần làm...': 'Task to do...',
  'Tên liên kết': 'Link label',
  'Di chuyển lên': 'Move up',
  'Di chuyển xuống': 'Move down',
  'Xóa Block': 'Delete block',
  'Cỡ chữ': 'Font size',
  'Cỡ mặc định': 'Default size',
  'Lặp lại': 'Repeat',
  'Không lặp': 'No repeat',
  'Mỗi ngày': 'Daily',
  'Mỗi tuần': 'Weekly',
  'Mỗi tháng': 'Monthly',
  'Chọn...': 'Select...',
  'Không có tùy chọn': 'No options',
  '-- Chọn --': '-- Select --',
  'Tên link': 'Link name',
  'Xóa': 'Delete',
  'Thêm': 'Add',
  'Bảng chưa có cột': 'This table has no columns',
  'Thêm cột và chọn loại nội dung cho cột đó.': 'Add a column and choose its content type.',
  'Thêm cột đầu tiên': 'Add the first column',
  'Chỉnh sửa cột': 'Edit column',
  'Xóa cột': 'Delete column',
  'Xóa hàng': 'Delete row',
  'Thêm hàng': 'Add row',
  'Thêm cột': 'Add column',
  'hàng': 'rows',
  'cột': 'columns',
  'Thêm cột mới': 'Add new column',
  'Tên cột': 'Column name',
  'Ví dụ: Trạng thái': 'Example: Status',
  'Loại nội dung': 'Content type',
  'Chọn loại...': 'Choose type...',
  'Các lựa chọn': 'Options',
  'Mỗi dòng là một lựa chọn.': 'One option per line.',
  'Hủy': 'Cancel',
  'Lưu thay đổi': 'Save changes',
  'Cập nhật thông tin cột': 'Update column information',
  'Tạo cột mới cho bảng': 'Create a new column for the table',
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    (localStorage.getItem('language') as Language) === 'en' ? 'en' : 'vi',
  )

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage)
    localStorage.setItem('language', nextLanguage)
  }

  const translate = (text: string) => {
    if (language === 'en') {
      return englishText[text] ?? text
    }
    return text
  }

  const t = (key: TranslationKey, params?: Record<string, string | number>) => {
    let value = dictionary[language][key] ?? dictionary.vi[key] ?? key
    
    for (const [name, replacement] of Object.entries(params ?? {})) {
      value = value.replace(`{${name}}`, String(replacement))
    }
    
    return value
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translate }}>
      {children}
    </LanguageContext.Provider>
  )
}
