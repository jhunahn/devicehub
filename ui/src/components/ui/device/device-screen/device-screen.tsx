import { useRef } from 'react'
import cn from 'classnames'
import { useParams } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { Spinner } from '@vkontakte/vkui'

import { ConditionalRender } from '@/components/lib/conditional-render'

import { TouchService } from '@/services/touch-service/touch-service'
import { KeyboardService } from '@/services/keyboard-service/keyboard-service'

import { useServiceLocator } from '@/lib/hooks/use-service-locator.hook'
import { DeviceScreenStore } from '@/store/device-screen-store/device-screen-store'
import { useScreenAutoQuality } from '@/lib/hooks/use-screen-auto-quality.hook'
import { useScreenStreaming } from '@/lib/hooks/use-screen-streaming.hook'

import styles from './device-screen.module.css'

import type { ChangeEvent, ClipboardEvent, KeyboardEvent, MouseEvent, TouchEvent } from 'react'

export const DeviceScreen = observer(() => {
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { serial } = useParams()
  const deviceScreenStore = useServiceLocator<DeviceScreenStore>(DeviceScreenStore.name)
  const touchService = useServiceLocator<TouchService>(TouchService.name)
  const keyboardService = useServiceLocator<KeyboardService>(KeyboardService.name)

  useScreenStreaming({ canvasRef, canvasWrapperRef, serial })
  useScreenAutoQuality(serial)

  const onMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (!serial) return

    event.preventDefault()

    touchService?.mouseDownListener({
      serial,
      mousePageX: event.pageX,
      mousePageY: event.pageY,
      eventTimestamp: event.timeStamp,
      isAltKeyPressed: event.altKey,
      isRightButtonPressed: event.button === 2,
      focusInput: () => inputRef.current?.focus(),
    })
  }

  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!serial) return

    event.preventDefault()

    touchService?.mouseMoveListener({
      serial,
      mousePageX: event.pageX,
      mousePageY: event.pageY,
      isRightButtonPressed: event.button === 2,
      isAltKeyPressed: event.altKey,
    })
  }

  const onMouseUp = (event: MouseEvent<HTMLDivElement>) => {
    if (!serial) return

    event.preventDefault()

    touchService?.mouseUpListener({
      serial,
      mousePageX: event.pageX,
      mousePageY: event.pageY,
      isRightButtonPressed: event.button === 2,
    })

    touchService?.mouseUpBugWorkaroundListener(event)
  }

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!serial) return

    touchService?.touchEndListener({
      serial,
      touches: event.nativeEvent.touches,
      changedTouches: event.nativeEvent.changedTouches,
    })
  }

  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!serial) return

    touchService?.touchMoveListener({ serial, changedTouches: event.nativeEvent.changedTouches })
  }

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!serial) return

    touchService?.touchStartListener({
      serial,
      touches: event.nativeEvent.touches,
      changedTouches: event.nativeEvent.changedTouches,
    })
  }

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    keyboardService?.changeListener({
      value: event.target.value,
      clearInput: () => {
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      },
    })
  }

  const onCopy = (event: ClipboardEvent) => {
    keyboardService?.copyListener({
      preventDefault: event.preventDefault,
      setClipboardData: (content) => event.clipboardData.setData('text/plain', content),
    })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    keyboardService?.keyDownListener({
      key: event.key,
      preventDefault: event.preventDefault,
    })
  }

  const onKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
    keyboardService?.keyUpListener({
      code: event.code,
      key: event.key,
      keyCode: event.keyCode,
      charCode: event.key.charCodeAt(0),
      preventDefault: event.preventDefault,
    })
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    keyboardService?.pasteListener({
      preventDefault: event.preventDefault,
      getClipboardData: () => event.clipboardData.getData('text/plain'),
    })
  }

  return (
    <>
      <div
        ref={canvasWrapperRef}
        className={styles.deviceScreen}
        role='none'
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
        onTouchStart={onTouchStart}
      >
        <div className={styles.canvasWrapper}>
          <canvas
            ref={canvasRef}
            className={cn(styles.canvas, { [styles.rotated]: !!deviceScreenStore?.isScreenRotated })}
          />
          {touchService?.slots.map((value, index) => (
            <span
              key={value}
              className={cn(styles.finger, { [styles.activeFinger]: touchService.fingers[index] })}
              style={
                touchService.fingers[index]
                  ? {
                      transform: `translate3d(${touchService.fingers[index].x}px,${touchService.fingers[index].y}px,0) scale(${touchService.fingers[index].pressure + 0.5},${touchService.fingers[index].pressure + 0.5}`,
                    }
                  : {}
              }
            />
          ))}
          <ConditionalRender conditions={[!!deviceScreenStore?.isScreenLoading]}>
            <Spinner className={styles.spinner} size='large' />
          </ConditionalRender>
        </div>
      </div>
      <input
        ref={inputRef}
        autoCapitalize='off'
        autoComplete='off'
        autoCorrect='off'
        className={styles.screenInput}
        inputMode='text'
        type='text'
        onChange={onInputChange}
        onCopy={onCopy}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onPaste={onPaste}
      />
    </>
  )
})
