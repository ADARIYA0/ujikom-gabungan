'use client'

import React, { useState, useCallback, useRef } from 'react'

export interface SimpleTextElement {
  id: string
  type: 'text'
  text: string
  position: { x: number; y: number }
  width?: number
  height?: number
  fontSize: number
  fontFamily: string
  color: string
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
  isDynamic?: boolean
  dynamicType?: 'user_name' | 'event_name'
}

export interface SimpleSignatureElement {
  id: string
  type: 'signature'
  position: { x: number; y: number }
  width: number
  height: number
  signatureData: string
  label?: string
}

export type SimpleElement = SimpleTextElement | SimpleSignatureElement

export interface SimpleElementEditorProps {
  elements: SimpleElement[]
  onElementsChange: (elements: SimpleElement[]) => void
  canvasWidth: number
  canvasHeight: number
  onOpenSignatureModal?: (element: SimpleSignatureElement) => void
  onElementSelect?: (element: SimpleElement) => void
}

export const SimpleElementEditor: React.FC<SimpleElementEditorProps> = ({
  elements,
  onElementsChange,
  canvasWidth,
  canvasHeight,
  onOpenSignatureModal,
  onElementSelect
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const lastUpdateRef = useRef<number>(0)
  
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const startDimensionsRef = useRef<{ width: number; height: number; fontSize: number } | null>(null)

  const handleElementClick = (elementId: string) => {
    setSelectedElementId(elementId)
    const element = elements.find(el => el.id === elementId)
    if (element && onElementSelect) {
      onElementSelect(element)
    }
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedElementId(null)
    }
  }

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const element = elements.find(el => el.id === elementId)
    if (!element || !canvasRef.current) return

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const offsetX = e.clientX - canvasRect.left - (element.position?.x || 0)
    const offsetY = e.clientY - canvasRect.top - (element.position?.y || 0)
    
    setDragOffset({ x: offsetX, y: offsetY })
    setIsDragging(true)
    setSelectedElementId(elementId)
  }

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: string, handle: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const element = elements.find(el => el.id === elementId)
    if (element) {
      startDimensionsRef.current = {
        width: element.width || 100,
        height: element.height || 50,
        fontSize: element.type === 'text' ? (element as SimpleTextElement).fontSize : 16
      }
    }
    
    setResizeHandle(handle)
    setIsResizing(true)
    setSelectedElementId(elementId)
    startTimeRef.current = performance.now()
  }

  const smoothUpdate = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return

    const currentTime = performance.now()
    const deltaTime = currentTime - lastUpdateRef.current
    
    if (deltaTime < 8) return
    lastUpdateRef.current = currentTime

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const mouseX = e.clientX - canvasRect.left
    const mouseY = e.clientY - canvasRect.top

    if (isDragging && selectedElementId) {
      const newX = mouseX - dragOffset.x
      const newY = mouseY - dragOffset.y

      const constrainedX = Math.max(0, Math.min(canvasWidth - 100, newX))
      const constrainedY = Math.max(0, Math.min(canvasHeight - 50, newY))

      onElementsChange(elements.map(el => 
        el.id === selectedElementId 
          ? { ...el, position: { x: constrainedX, y: constrainedY } }
          : el
      ))
    } else if (isResizing && selectedElementId && resizeHandle) {
      const element = elements.find(el => el.id === selectedElementId)
      if (!element) return

      if (element.type === 'text' || element.type === 'signature') {
        const currentWidth = element.width || 100
        const currentHeight = element.height || 50
        let newWidth = currentWidth
        let newHeight = currentHeight

        switch (resizeHandle) {
          case 'se':
            newWidth = Math.max(50, mouseX - (element.position?.x || 0))
            newHeight = Math.max(30, mouseY - (element.position?.y || 0))
            break
          case 'sw':
            newWidth = Math.max(50, (element.position?.x || 0) + currentWidth - mouseX)
            newHeight = Math.max(30, mouseY - (element.position?.y || 0))
            break
          case 'ne':
            newWidth = Math.max(50, mouseX - (element.position?.x || 0))
            newHeight = Math.max(30, (element.position?.y || 0) + currentHeight - mouseY)
            break
          case 'nw':
            newWidth = Math.max(50, (element.position?.x || 0) + currentWidth - mouseX)
            newHeight = Math.max(30, (element.position?.y || 0) + currentHeight - mouseY)
            break
          case 'e':
            newWidth = Math.max(50, mouseX - (element.position?.x || 0))
            break
          case 'w':
            newWidth = Math.max(50, (element.position?.x || 0) + currentWidth - mouseX)
            break
          case 'n':
            newHeight = Math.max(30, (element.position?.y || 0) + currentHeight - mouseY)
            break
          case 's':
            newHeight = Math.max(30, mouseY - (element.position?.y || 0))
            break
        }

        newWidth = Math.min(newWidth, canvasWidth - (element.position?.x || 0))
        newHeight = Math.min(newHeight, canvasHeight - (element.position?.y || 0))

        let newFontSize = 16
        if (element.type === 'text' && startDimensionsRef.current) {
          const textElement = element as SimpleTextElement
          const cornerHandles = ['se', 'sw', 'ne', 'nw']
          
          if (cornerHandles.includes(resizeHandle)) {
            const widthFactor = newWidth / startDimensionsRef.current.width
            const heightFactor = newHeight / startDimensionsRef.current.height
            const avgFactor = (widthFactor + heightFactor) / 2
            const startFontSize = startDimensionsRef.current.fontSize
            const calculatedFontSize = startFontSize * avgFactor
            newFontSize = Math.max(8, Math.min(120, Math.round(calculatedFontSize)))
          } else {
            newFontSize = textElement.fontSize
          }
        }

        onElementsChange(elements.map(el => 
          el.id === selectedElementId 
            ? { 
                ...el, 
                width: newWidth, 
                height: newHeight,
                ...(element.type === 'text' ? { fontSize: newFontSize } : {})
              }
            : el
        ))
      }
    }
  }, [isDragging, isResizing, selectedElementId, resizeHandle, dragOffset, elements, onElementsChange, canvasWidth, canvasHeight])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    smoothUpdate(e)
  }, [smoothUpdate])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    startDimensionsRef.current = null
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  React.useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const deleteElement = (elementId: string) => {
    onElementsChange(elements.filter(el => el.id !== elementId))
    if (selectedElementId === elementId) {
      setSelectedElementId(null)
    }
  }

  const selectedElement = elements.find(el => el.id === selectedElementId)

  return (
    <div className="simple-element-editor">
      <div 
        ref={canvasRef}
        className="element-canvas"
        onClick={handleCanvasClick}
        style={{
          width: canvasWidth,
          height: canvasHeight,
          position: 'relative',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          background: 'transparent',
          overflow: 'hidden'
        }}
      >
        {elements.filter(element => element.position).map(element => {
          if (element.type === 'text') {
            return (
              <div
                key={element.id}
                onClick={() => handleElementClick(element.id)}
                onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                onMouseEnter={() => setHoveredElementId(element.id)}
                onMouseLeave={() => setHoveredElementId(null)}
                style={{
                  position: 'absolute',
                  left: element.position?.x || 0,
                  top: element.position?.y || 0,
                  width: element.width || 'auto',
                  height: element.height || 'auto',
                  fontSize: element.fontSize,
                  fontFamily: element.fontFamily,
                  color: element.color,
                  fontWeight: element.fontWeight,
                  textAlign: element.textAlign,
                  cursor: isDragging && selectedElementId === element.id ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  border: selectedElementId === element.id ? '2px dashed #0d9488' : '1px dashed transparent',
                  borderRadius: '4px',
                  backgroundColor: selectedElementId === element.id ? 'rgba(13, 148, 136, 0.1)' : 'transparent',
                  transition: isDragging || isResizing ? 'none' : 'all 0.15s ease',
                  zIndex: selectedElementId === element.id ? 20 : 10,
                  maxWidth: canvasWidth - (element.position?.x || 0),
                  wordWrap: 'break-word',
                  minWidth: '50px',
                  minHeight: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  padding: '8px'
                }}
              >
                {element.text}
                
                {hoveredElementId === element.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteElement(element.id)
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-lg z-30"
                    title="Delete element"
                  >
                    ×
                  </button>
                )}
                
                {selectedElementId === element.id && (
                  <>
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '-12px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: 'nw-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'nw')}
                    />
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '-12px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: 'ne-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'ne')}
                    />
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        bottom: '-12px',
                        left: '-12px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: 'sw-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'sw')}
                    />
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        bottom: '-12px',
                        right: '-12px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: 'se-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'se')}
                    />
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '-12px',
                        width: '20px',
                        height: '28px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '8px',
                        cursor: 'w-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'w')}
                    />
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        right: '-12px',
                        width: '20px',
                        height: '28px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '8px',
                        cursor: 'e-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'e')}
                    />
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        width: '28px',
                        height: '20px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '8px',
                        cursor: 'n-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transform: 'translateX(-50%)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'n')}
                    />
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        bottom: '-12px',
                        left: '50%',
                        width: '28px',
                        height: '20px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '8px',
                        cursor: 's-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transform: 'translateX(-50%)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 's')}
                    />
                  </>
                )}
              </div>
            )
          } else if (element.type === 'signature') {
            return (
              <div
                key={element.id}
                onClick={() => handleElementClick(element.id)}
                onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                onMouseEnter={() => setHoveredElementId(element.id)}
                onMouseLeave={() => setHoveredElementId(null)}
                style={{
                  position: 'absolute',
                  left: element.position?.x || 0,
                  top: element.position?.y || 0,
                  width: element.width,
                  height: element.height,
                  cursor: isDragging && selectedElementId === element.id ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  border: selectedElementId === element.id ? '2px dashed #0d9488' : '1px dashed transparent',
                  borderRadius: '4px',
                  backgroundColor: selectedElementId === element.id ? 'rgba(13, 148, 136, 0.1)' : 'transparent',
                  transition: isDragging || isResizing ? 'none' : 'all 0.15s ease',
                  zIndex: selectedElementId === element.id ? 20 : 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {element.signatureData ? (
                  <img
                    src={element.signatureData}
                    alt="Signature"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      border: '2px dashed #ccc',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                      fontSize: '12px',
                      textAlign: 'center'
                    }}
                  >
                    📝 Signature Placeholder
                  </div>
                )}
                {element.label && (
                  <div
                    style={{
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '2px',
                      textAlign: 'center'
                    }}
                  >
                    {element.label}
                  </div>
                )}
                
                {hoveredElementId === element.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteElement(element.id)
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-lg z-30"
                    title="Delete element"
                  >
                    ×
                  </button>
                )}
                
                {selectedElementId === element.id && (
                  <>
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '-12px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: 'nw-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'nw')}
                    />
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '-12px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: 'ne-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'ne')}
                    />
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        bottom: '-12px',
                        left: '-12px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: 'sw-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'sw')}
                    />
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        bottom: '-12px',
                        right: '-12px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '50%',
                        cursor: 'se-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'se')}
                    />
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '-12px',
                        width: '20px',
                        height: '28px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '8px',
                        cursor: 'w-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'w')}
                    />
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        right: '-12px',
                        width: '20px',
                        height: '28px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '8px',
                        cursor: 'e-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'e')}
                    />
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        width: '28px',
                        height: '20px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '8px',
                        cursor: 'n-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transform: 'translateX(-50%)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 'n')}
                    />
                    <div
                      className="resize-handle"
                      style={{
                        position: 'absolute',
                        bottom: '-12px',
                        left: '50%',
                        width: '28px',
                        height: '20px',
                        backgroundColor: '#0d9488',
                        border: '2px solid white',
                        borderRadius: '8px',
                        cursor: 's-resize',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transform: 'translateX(-50%)',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => handleResizeMouseDown(e, element.id, 's')}
                    />
                  </>
                )}
              </div>
            )
          }
          return null
        })}
      </div>
    </div>
  )
}

export default SimpleElementEditor

