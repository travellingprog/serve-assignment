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

import { toaster } from "@/components/ui/toaster"
import { useMoveRobots } from '@/hooks/api';

import type { SubmitEvent } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

export function MoveRobotsDialog(props: Props) {
  const [meters, setMeters] = useState('')
  const { trigger, errorMsg, isMutating } = useMoveRobots()

  useEffect(() => {
    if (errorMsg) {
      toaster.create({
        description: errorMsg,
        type: "error",
        closable: true,
      })
    }
  }, [errorMsg])

  function onClose() {
    props.onClose()
    setMeters('')
  }

  function onSubmit(event: SubmitEvent) {
    event.preventDefault()
    trigger({ meters: meters ? Number(meters) : undefined }, {
      onSuccess() {
        onClose()
      }
    })
  }

  return (
    <>
      <Dialog.Root
        open={props.open}
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
                <Dialog.Title>Move Robots</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body asChild>
                <form id="moveForm" onSubmit={onSubmit}>
                  <Field.Root>
                    <Field.Label>
                      Move all robots by X meters
                      <Field.RequiredIndicator
                        fallback={
                          <Badge size="xs" variant="surface">
                            Optional
                          </Badge>
                        }
                      />
                    </Field.Label>
                    <NumberInput.Root value={meters} onValueChange={({ value }) => {setMeters(value)}} min={1} width="200px" inputMode="numeric">
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
                <Button disabled={isMutating} colorPalette="green" form="moveForm" type="submit">Move</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
