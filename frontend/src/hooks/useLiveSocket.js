import { useCallback, useEffect, useRef, useState } from 'react'

function socketUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL

  if (import.meta.env.VITE_API_BASE) {
    const apiUrl = new URL(import.meta.env.VITE_API_BASE)
    apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    apiUrl.pathname = `${apiUrl.pathname.replace(/\/$/, '')}/ws`
    return apiUrl.toString()
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}/ws`
}

const MAX_BACKOFF_MS = 10_000

/**
 * A single WebSocket connection to the backend that reconnects with
 * exponential backoff and keeps the watched match subscribed across
 * reconnects.
 *
 * status: 'connecting' | 'connected' | 'disconnected'
 */
export function useLiveSocket({ onMessage, onReconnect }) {
  const [status, setStatus] = useState('connecting')
  const socketRef = useRef(null)
  const watchedRef = useRef(null)
  const handlersRef = useRef({ onMessage, onReconnect })

  useEffect(() => {
    handlersRef.current = { onMessage, onReconnect }
  })

  const send = useCallback((payload) => {
    const socket = socketRef.current
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload))
    }
  }, [])

  useEffect(() => {
    let attempt = 0
    let retryTimer = null
    let disposed = false
    let hasConnectedBefore = false

    function connect() {
      setStatus('connecting')
      const socket = new WebSocket(socketUrl())
      socketRef.current = socket

      socket.addEventListener('open', () => {
        attempt = 0
        setStatus('connected')
        if (watchedRef.current != null) {
          socket.send(JSON.stringify({ type: 'subscribe', matchId: watchedRef.current }))
        }
        if (hasConnectedBefore) handlersRef.current.onReconnect?.()
        hasConnectedBefore = true
      })

      socket.addEventListener('message', (event) => {
        let message
        try {
          message = JSON.parse(event.data)
        } catch {
          return
        }
        handlersRef.current.onMessage?.(message)
      })

      socket.addEventListener('error', (event) => {
        console.error(`WebSocket connection failed: ${socket.url}`, event)
      })

      socket.addEventListener('close', () => {
        if (disposed) return
        setStatus('disconnected')
        const delay = Math.min(MAX_BACKOFF_MS, 500 * 2 ** attempt)
        attempt += 1
        retryTimer = setTimeout(connect, delay)
      })
    }

    connect()

    return () => {
      disposed = true
      clearTimeout(retryTimer)
      socketRef.current?.close()
    }
  }, [])

  const watch = useCallback(
    (matchId) => {
      const previous = watchedRef.current
      if (previous === matchId) return
      if (previous != null) send({ type: 'unsubscribe', matchId: previous })
      watchedRef.current = matchId
      if (matchId != null) send({ type: 'subscribe', matchId })
    },
    [send],
  )

  return { status, watch }
}
