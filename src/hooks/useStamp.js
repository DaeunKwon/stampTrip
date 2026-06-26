import { useState, useCallback } from 'react'
import { getStamps, addStamp, removeStamp, hasStamp, clearStamps } from '../store/stampStore'

export default function useStamp() {
  const [stamps, setStamps] = useState(() => getStamps())

  const stamp = useCallback((spot) => {
    setStamps(addStamp(spot))
  }, [])

  const unstamp = useCallback((contentId) => {
    setStamps(removeStamp(contentId))
  }, [])

  const isStamped = useCallback((contentId) => hasStamp(contentId), [])

  const clear = useCallback(() => {
    setStamps(clearStamps())
  }, [])

  return { stamps, stamp, unstamp, isStamped, clear }
}
