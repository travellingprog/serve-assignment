import {
  Badge,
  Button,
  CloseButton,
  Dialog,
  Field,
  NumberInput,
  Portal,
} from "@chakra-ui/react"
import { useEffect, useState } from "react"

import { useAutoStepRobots } from "@/hooks/api"
import { toaster } from "@/components/ui/toaster"

import type { SubmitEvent } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  startAuto: ReturnType<typeof useAutoStepRobots>['startAuto']
  errorMsg: ReturnType<typeof useAutoStepRobots>['errorMsg']
  isMutating: ReturnType<typeof useAutoStepRobots>['isMutating']
}

/** Our dialog to make all robots move automatically */
export function StartAutoDialog(props: Props) {
  const [meters, setMeters] = useState('')
  const [intervalSec, setIntervalSec] = useState('')
  const { startAuto, errorMsg, isMutating, open } = props

  useEffect(() => {
    if (errorMsg && open) {
      toaster.create({
        description: errorMsg,
        type: "error",
        closable: true,
      })
    }
  }, [errorMsg, open])

  function onClose() {
    props.onClose()
    setMeters('')
    setIntervalSec('')
  }

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault()
    await startAuto({
      meters: meters ? Number(meters) : undefined,
      intervalMs: intervalSec ? Number(intervalSec) * 1000 : undefined,
    })
    onClose()
  }

  return (
    <>
      <Dialog.Root
        open={open}
        size="md"
        onOpenChange={(e) => {
          if (!e.open) onClose()
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.CloseTrigger asChild>
                <CloseButton />
              </Dialog.CloseTrigger>
              <Dialog.Header>
                <Dialog.Title>Start Auto-Step</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body asChild>
                <form id="startAutoForm" onSubmit={onSubmit}>
                  <Field.Root>
                    <Field.Label>
                      Move all robots every X seconds
                      <Field.RequiredIndicator
                        fallback={
                          <Badge size="xs" variant="surface">
                            Optional
                          </Badge>
                        }
                      />
                    </Field.Label>
                    <NumberInput.Root value={intervalSec} onValueChange={({ value }) => {setIntervalSec(value)}} min={0} width="200px" inputMode="numeric">
                      <NumberInput.Control />
                      <NumberInput.Input />
                    </NumberInput.Root>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>
                      Move by X meters
                      <Field.RequiredIndicator
                        fallback={
                          <Badge size="xs" variant="surface">
                            Optional
                          </Badge>
                        }
                      />
                    </Field.Label>
                    <NumberInput.Root value={meters} onValueChange={({ value }) => {setMeters(value)}} min={0} width="200px" inputMode="numeric">
                      <NumberInput.Control />
                      <NumberInput.Input />
                    </NumberInput.Root>
                  </Field.Root>
                </form>
              </Dialog.Body>
              <Dialog.Footer>
                <Button disabled={isMutating} variant="outline" onClick={() => onClose()}>
                  Cancel
                </Button>
                <Button disabled={isMutating} colorPalette="green" form="startAutoForm" type="submit">Start</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
