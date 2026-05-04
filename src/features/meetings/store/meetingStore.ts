import { create } from 'zustand'
import { Meeting, MeetingActionItem } from '../types/meeting.types'

interface MeetingState {
  meetings: Meeting[]
  actionItems: Record<string, MeetingActionItem[]> // keyed by meeting_id
  loading: boolean

  setMeetings: (m: Meeting[]) => void
  addMeeting: (m: Meeting) => void
  updateMeeting: (id: string, u: Partial<Meeting>) => void
  removeMeeting: (id: string) => void

  setActionItems: (meetingId: string, items: MeetingActionItem[]) => void
  addActionItem: (item: MeetingActionItem) => void
  updateActionItem: (id: string, u: Partial<MeetingActionItem>) => void
  removeActionItem: (id: string) => void

  setLoading: (l: boolean) => void
}

export const useMeetingStore = create<MeetingState>((set) => ({
  meetings: [],
  actionItems: {},
  loading: false,

  setMeetings: (meetings) => set({ meetings }),
  addMeeting: (m) => set((s) => ({ meetings: [m, ...s.meetings] })),
  updateMeeting: (id, u) =>
    set((s) => ({ meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...u } : m)) })),
  removeMeeting: (id) =>
    set((s) => ({ meetings: s.meetings.filter((m) => m.id !== id) })),

  setActionItems: (meetingId, items) =>
    set((s) => ({ actionItems: { ...s.actionItems, [meetingId]: items } })),
  addActionItem: (item) =>
    set((s) => ({
      actionItems: {
        ...s.actionItems,
        [item.meeting_id]: [...(s.actionItems[item.meeting_id] ?? []), item],
      },
    })),
  updateActionItem: (id, u) =>
    set((s) => {
      const updated = { ...s.actionItems }
      for (const mid in updated) {
        updated[mid] = updated[mid].map((i) => (i.id === id ? { ...i, ...u } : i))
      }
      return { actionItems: updated }
    }),
  removeActionItem: (id) =>
    set((s) => {
      const updated = { ...s.actionItems }
      for (const mid in updated) {
        updated[mid] = updated[mid].filter((i) => i.id !== id)
      }
      return { actionItems: updated }
    }),

  setLoading: (loading) => set({ loading }),
}))
