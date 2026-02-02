import { useEffect, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'

const ROBOTS_KEY = '/robots'

const postHeaders = new Headers()
postHeaders.append('Content-Type', 'application/json')

async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  return fetch(url, init).then(r => r.json())
}

export interface Robot {
  index: number
  position: [number, number]
}

interface RespRobots {
  robots: [number, number][]
}

/** Takes the RespRobots object and returns an array of Robots */
function processRespRobots(respData: RespRobots | undefined) : Robot[] {
  if (!respData) return []

  return respData.robots.map((position, index) => {
    return { index, position }
  })
}

/** Get all robot positions */
export function useRobots() {
  const [robots, setRobots] = useState<Robot[]>([])
  const { data, error, isLoading } = useSWR<RespRobots>(ROBOTS_KEY, fetcher, {
    onError(err) {
      console.error('Failed to get robots:', err)
    }
  })

  useEffect(() => {
    setRobots(processRespRobots(data))
  }, [data])

  return {
    robots,
    isLoading,
    errorMsg: error ? 'Failed to get latest robots position' : null,
  }
}

interface ReqMove {
  meters?: number
}

/** Send an API request to move the robots */
function postMoveRobots(_url: string, { arg }: { arg: ReqMove }) {
  return fetcher<RespRobots>('/move', {
    method: 'POST',
    headers: postHeaders,
    body: JSON.stringify(arg)
  })
}

/** Move all robots a certain distance */
export function useMoveRobots() {
  const { trigger, error, isMutating } = useSWRMutation(ROBOTS_KEY, postMoveRobots, {
    populateCache: true,
    revalidate: false,
    onError(err) {
      console.error('Failed to move robots:', err)
    },
  })

  return {
    trigger,
    errorMsg: error ? 'Failed to move robots' : null,
    isMutating,
  }
}

interface ReqReset {
  count?: number
}

/** Send an API request to reset the robots */
function postReset(_url: string, { arg }: { arg: ReqReset }) {
  return fetcher<RespRobots>('/reset', {
    method: 'POST',
    headers: postHeaders,
    body: JSON.stringify(arg)
  })
}

/** Re-spawn the robots */
export function useReset() {
  const { trigger, error, isMutating } = useSWRMutation(ROBOTS_KEY, postReset, {
    populateCache: true,
    revalidate: false,
    onError(err) {
      console.error('Failed to reset:', err)
    },
  })

  return {
    trigger,
    errorMsg: error ? 'Failed to reset' : null,
    isMutating,
  }
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

/** Send an API request to start auto-stepping the robots */
function postStartAuto(_url: string, { arg }: { arg: ReqStartAuto }) {
  return fetcher<RespStartAuto>('/start-auto', {
    method: 'POST',
    headers: postHeaders,
    body: JSON.stringify(arg),
  })
}

/** Send an API request to stop auto-stepping the robots */
function postStopAuto() {
  return fetcher<RespStopAuto>('/stop-auto', {
    method: 'POST',
    headers: postHeaders,
  })
}

/** Auto-step the robots */
export function useAutoStepRobots() {
  const [autoId, setAutoId] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const { mutate } = useSWRConfig()

  const startMutation = useSWRMutation('/start-auto', postStartAuto, {
    onSuccess(data) {
      console.log('start success')
      const newAutoId = setInterval(() => { mutate(ROBOTS_KEY) }, data.intervalMs)
      setAutoId(newAutoId)
      console.log('newAutoId', newAutoId)
    },
    onError(err) {
      console.error('Failed to auto-step the robots:', err)
      setErrorMsg('Failed to auto-step the robots')
    },
  })

  const stopMutation = useSWRMutation('/stop-auto', postStopAuto, {
    onSuccess() {
      if (autoId) clearInterval(autoId)
      setAutoId(null)
    },
    onError(err) {
      console.error('Failed to stop the auto-step:', err)
      setErrorMsg('Failed to stop the auto-step')
    },
  })

  return {
    autoEnabled: !!autoId,
    startAuto: startMutation.trigger,
    stopAuto: stopMutation.trigger,
    errorMsg,
    isMutating: startMutation.isMutating || stopMutation.isMutating,
  }
}
