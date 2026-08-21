import { useEffect, useMemo, useState } from 'react'
import { Bell, BellRing, Check, X } from 'lucide-react'
import type { Page } from '../../types/page'
import { useLanguage } from '../../hooks/useLanguage'

interface NotificationBellProps {
  pages: Page[]
  onSelectPage: (pageId: string) => void
}

interface Reminder {
  id: string
  pageId: string
  title: string
  dueDate: number
  kind: 'overdue' | 'upcoming'
}

const READ_KEY = 'readNotificationIds'
const NOTIFIED_KEY = 'sentNotificationIds'

function NotificationBell({ pages, onSelectPage }: NotificationBellProps) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    typeof Notification === 'undefined' ? 'denied' : Notification.permission,
  )
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(READ_KEY) ?? '[]') as string[]
    } catch {
      return []
    }
  })

  const reminders = useMemo<Reminder[]>(() => {
    const now = Date.now()
    const tomorrow = now + 24 * 60 * 60 * 1000

    return pages
      .filter((page) => page.type === 'task' && page.status !== 'done' && page.status !== 'archived' && (page.reminderEnabled ? page.reminderAt : page.dueDate))
      .filter((page) => ((page.reminderEnabled ? page.reminderAt : page.dueDate) ?? 0) <= tomorrow)
      .map((page): Reminder => ({
        id: `${page.id}-${page.reminderEnabled ? page.reminderAt : page.dueDate}`,
        pageId: page.id,
        title: page.title || t('page.untitled'),
        dueDate: (page.reminderEnabled ? page.reminderAt : page.dueDate) ?? now,
        kind: ((page.reminderEnabled ? page.reminderAt : page.dueDate) ?? now) < now ? 'overdue' : 'upcoming',
      }))
      .sort((a, b) => a.dueDate - b.dueDate)
  }, [pages, t])

  const unreadCount = reminders.filter((reminder) => !readIds.includes(reminder.id)).length

  useEffect(() => {
    const dueReminders = reminders.filter((reminder) => !readIds.includes(reminder.id))
    if (permission !== 'granted' || dueReminders.length === 0) return

    let sentIds: string[] = []
    try {
      sentIds = JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '[]') as string[]
    } catch {
      sentIds = []
    }

    const reminder = dueReminders.find((item) => !sentIds.includes(item.id))
    if (!reminder) return

    new Notification(reminder.kind === 'overdue' ? t('notification.overdueTitle') : t('notification.upcomingTitle'), {
      body: `${reminder.title} • ${new Date(reminder.dueDate).toLocaleDateString()}`,
      tag: reminder.id,
    })
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...sentIds, reminder.id]))
  }, [permission, readIds, reminders, t])

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return
    const nextPermission = await Notification.requestPermission()
    setPermission(nextPermission)
  }

  const markAllRead = () => {
    const nextIds = Array.from(new Set([...readIds, ...reminders.map((reminder) => reminder.id)]))
    setReadIds(nextIds)
    localStorage.setItem(READ_KEY, JSON.stringify(nextIds))
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        title={t('notification.open')}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-app-muted transition hover:bg-app-hover hover:text-primary"
      >
        {unreadCount > 0 ? <BellRing size={17} /> : <Bell size={17} />}
        {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <>
          <button type="button" aria-label={t('common.close')} className="fixed inset-0 z-40 h-full w-full cursor-default" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-app-border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-app-border border-t-4 border-t-primary px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-app-text">{t('notification.title')}</h2>
                <p className="mt-0.5 text-[11px] text-app-muted">{t('notification.description')}</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-md p-1 text-app-muted hover:bg-app-hover"><X size={15} /></button>
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {reminders.length === 0 && <p className="px-3 py-6 text-center text-xs text-app-muted">{t('notification.empty')}</p>}
              {reminders.map((reminder) => (
                <button key={reminder.id} type="button" onClick={() => { onSelectPage(reminder.pageId); setIsOpen(false) }} className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-primary/5">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${reminder.kind === 'overdue' ? 'bg-danger' : 'bg-primary'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-app-text">{reminder.title}</span>
                    <span className="mt-0.5 block text-[10px] text-app-muted">{reminder.kind === 'overdue' ? t('notification.overdue') : t('notification.upcoming')} • {new Date(reminder.dueDate).toLocaleString()}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-app-border bg-app-surface/50 px-3 py-2">
              <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1 text-[10px] font-medium text-app-muted hover:text-primary"><Check size={12} />{t('notification.markRead')}</button>
              {permission !== 'granted' && <button type="button" onClick={() => void requestPermission()} className="text-[10px] font-semibold text-primary hover:text-primary-dark">{t('notification.enable')}</button>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
