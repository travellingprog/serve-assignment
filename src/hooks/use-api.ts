import { useCallback, useState } from 'react'
import { useGet, usePost } from './use-fetch'

interface Robot {
  index: number
  position: [number, number]
}

interface ReqMove {
  meters?: number
}

interface ReqReset {
  count?: number
}

interface RespRobots {
  robots: [number, number][]
}

interface ReqStartAuto {
  meters?: number
  intervalMs?: number
}

interface RespStartAuto {
  status: string
  meters: number
  intervalMs: number
}

interface RespStopAuto {
  status: string
}

const postHeaders = new Headers()
postHeaders.append('Content-Type', 'application/json')

/** Takes the RespRobots object and returns an array of Robots */
function processRespRobots(respData: RespRobots | null) : Robot[] {
  if (!respData) return []

  return respData.robots.map((position, index) => {
    return { index, position }
  })
}

/** a hook that allows easy interaction with the API */
export function useApi() {
  const [robots, setRobots] = useState<Robot[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [autoId, setAutoId] = useState<number | null>(null)

  const apiGetRobots = useGet<RespRobots>('/robots')
  const apiPostMove = usePost<RespRobots>('/move', { headers: postHeaders })
  const apiPostReset = usePost<RespRobots>('/reset', { headers: postHeaders })
  const apiPostStartAuto = usePost<RespStartAuto>('/start-auto', { headers: postHeaders })
  const apiPostStopAuto = usePost<RespStopAuto>('/stop-auto', { headers: postHeaders })

  /** Get all robot positions */
  const getRobots = useCallback(async () => {
    try {
      const respData = await apiGetRobots.execute()
      setRobots(processRespRobots(respData))
    } catch (err) {
      console.error('Failed to get robots:', err)
      setErrorMsg('Failed to get latest robots position')
    }
  }, [apiGetRobots, setErrorMsg, setRobots])

  /** Move all robots a certain distance */
  const moveRobots = useCallback(async (reqData: ReqMove = {}) => {
    try {
      const respData = await apiPostMove.execute(undefined, {
        body: JSON.stringify(reqData)
      })
      setRobots(processRespRobots(respData))
    } catch (err) {
      console.error('Failed to move robots:', err)
      setErrorMsg('Failed to move robots')
    }
  }, [apiPostMove, setErrorMsg, setRobots])

  /** Re-spawn the robots */
  const reset = useCallback(async (reqData: ReqReset = {}) => {
    try {
      const respData = await apiPostReset.execute(undefined, {
        body: JSON.stringify(reqData)
      })
      setRobots(processRespRobots(respData))
    } catch (err) {
      console.error('Failed to reset:', err)
      setErrorMsg('Failed to reset')
    }
  }, [apiPostReset, setErrorMsg, setRobots])

  /** Start auto-stepping the robots */
  const startAuto = useCallback(async (reqData: ReqStartAuto = {}) => {
    try {
      const respData = await apiPostStartAuto.execute(undefined, {
        body: JSON.stringify(reqData)
      })
      if (respData) {
        const newAutoId = setInterval(getRobots, respData.intervalMs)
        setAutoId(newAutoId)
      } else {
        throw new Error('Response is empty!')
      }
    } catch (err) {
      console.error('Failed to auto-step the robots:', err)
      setErrorMsg('Failed to auto-step the robots')
    }
  }, [apiPostStartAuto, getRobots, setErrorMsg])

  /** Stop auto-stepping the robots */
  const stopAuto = useCallback(async () => {
    try {
      const respData = await apiPostStopAuto.execute()
      if (respData) {
        if (autoId) clearInterval(autoId)
        setAutoId(null)
      } else {
        throw new Error('Response is empty!')
      }
    } catch (err) {
      console.error('Failed to stop the auto-step:', err)
      setErrorMsg('Failed to stop the auto-step')
    }
  }, [apiPostStopAuto, autoId, setAutoId, setErrorMsg])

  return {
    robots,
    errorMsg,
    autoEnabled: !!autoId,

    // actions
    getRobots,
    moveRobots,
    reset,
    startAuto,
    stopAuto,

    // in-progress states
    moveRobotsLoading: apiPostMove.loading,
    resetLoading: apiPostReset.loading,
    startAutoLoading: apiPostStartAuto.loading,
    stopAutoLoading: apiPostStopAuto.loading,
  }
}
