import { useEffect } from 'react'
import { fetchMeetings } from '../services/meetingService'
import { useMeetingStore } from '../store/meetingStore'


export function useMeetingData() {
  const { loading, setLoading, setMeetings } = useMeetingStore()

  useEffect(() => {
    if (loading) return
    setLoading(true)
    fetchMeetings()
      .then(setMeetings)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
