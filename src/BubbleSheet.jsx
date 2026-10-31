import { useEffect, useRef } from 'react'
import { INDEXES } from './sheet.js'

export default function BubbleSheet({ popped, onPop, locked = false }) {
  const dragging = useRef(false)

  useEffect(() => {
    const stopDragging = () => {
      dragging.current = false
    }
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)
    return () => {
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [])

  const popAtPoint = (clientX, clientY) => {
    if (locked) return
    const element = document.elementFromPoint(clientX, clientY)
    const bubble = element?.closest('[data-bubble-index]')
    if (!bubble) return
    onPop(Number(bubble.dataset.bubbleIndex))
  }

  return (
    <div className="board">
      <div
        className={locked ? 'sheet sheet-locked' : 'sheet'}
        onPointerDown={() => {
          if (!locked) dragging.current = true
        }}
        onPointerMove={(event) => {
          if (dragging.current) popAtPoint(event.clientX, event.clientY)
        }}
      >
        {INDEXES.map((index) => {
          const isPopped = popped.has(index)
          return (
            <button
              key={index}
              type="button"
              tabIndex={-1}
              className={isPopped ? 'bubble popped' : 'bubble'}
              data-bubble-index={index}
              aria-label={`Bubble ${index + 1}${isPopped ? ', popped' : ''}`}
              aria-pressed={isPopped}
              onPointerDown={(event) => {
                event.preventDefault()
                if (!locked) onPop(index)
              }}
              onPointerEnter={() => {
                if (!locked && dragging.current) onPop(index)
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
