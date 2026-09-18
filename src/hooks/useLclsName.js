import { useState, useEffect } from 'react'
import { getLclsSystmName } from '../api/tourApi'

/** 행사의 분류 코드(lclsSystm1~3) → 분류명. 불러오는 동안은 '...', 코드가 없거나 실패하면 ''. */
export default function useLclsName({ lclsSystm1, lclsSystm2, lclsSystm3 }) {
  const [catName, setCatName] = useState('...')

  useEffect(() => {
    if (!lclsSystm1 && !lclsSystm2 && !lclsSystm3) {
      setCatName('')
      return
    }
    getLclsSystmName({ lclsSystm1, lclsSystm2, lclsSystm3 })
      .then(name => setCatName(name || ''))
      .catch(() => setCatName(''))
  }, [lclsSystm1, lclsSystm2, lclsSystm3])

  return catName
}
