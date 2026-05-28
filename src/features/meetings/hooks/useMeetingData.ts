import { useEffect, useRef } from 'react'
import { fetchMeetings } from '../services/meetingService'
import { useMeetingStore } from '../store/meetingStore'

export function useMeetingData() {
  const { setLoading, setMeetings } = useMeetingStore()
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    setLoading(true)
    fetchMeetings()
      .then(setMeetings)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
