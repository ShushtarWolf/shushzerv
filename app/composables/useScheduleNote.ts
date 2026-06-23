import type { ScheduleEvent } from '~/types'

export type ScheduleNoteRole = 'club' | 'coach'

export function scheduleNoteTarget(event: ScheduleEvent, role: ScheduleNoteRole) {
  if (role === 'club') {
    if (event.type === 'slot' && event.slotId) return { type: 'slot' as const, id: event.slotId }
    if (event.type === 'booking' && event.bookingId) return { type: 'booking' as const, id: event.bookingId }
    if (event.type === 'class' && event.classId) return { type: 'class' as const, id: event.classId }
  } else {
    if (event.type === 'session' && event.sessionId) return { type: 'session' as const, id: event.sessionId }
    if (event.type === 'class' && event.classId) return { type: 'class' as const, id: event.classId }
  }
  return null
}

export function scheduleNoteApiPath(role: ScheduleNoteRole) {
  return role === 'club' ? '/api/club/schedule-note' : '/api/coach/schedule-note'
}
