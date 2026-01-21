// ============================================
// Galderma TrackWise AI Autopilot Demo
// WebSocket Hook - Real-time Timeline Updates
// ============================================

import { useEffect, useRef, useCallback } from 'react'
import { useTimelineStore } from '@/stores'
import type { TimelineEvent } from '@/types'

const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/timeline`
const RECONNECT_DELAY = 3000
const PING_INTERVAL = 30000

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const pingIntervalRef = useRef<number | null>(null)

  const { addEvent, setConnected } = useTimelineStore()

  const connect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    try {
      const ws = new WebSocket(WS_URL)

      ws.onopen = () => {
        console.log('[WebSocket] Connected')
        setConnected(true)

        // Start ping interval
        pingIntervalRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping')
          }
        }, PING_INTERVAL)
      }

      ws.onmessage = (event) => {
        // Ignore pong messages
        if (event.data === 'pong') return

        try {
          const data = JSON.parse(event.data) as TimelineEvent
          addEvent(data)
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e)
        }
      }

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected')
        setConnected(false)

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }

        // Schedule reconnect
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log('[WebSocket] Reconnecting...')
          connect()
        }, RECONNECT_DELAY)
      }

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
      }

      wsRef.current = ws
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error)

      // Schedule reconnect
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect()
      }, RECONNECT_DELAY)
    }
  }, [addEvent, setConnected])

  const disconnect = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setConnected(false)
  }, [setConnected])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected: useTimelineStore((state) => state.isConnected),
    reconnect: connect,
    disconnect,
  }
}
