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
import { useReset } from '@/hooks/api';

import type { SubmitEvent } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

export function ResetDialog(props: Props) {
  const [count, setCount] = useState('')
  const { trigger, errorMsg, isMutating } = useReset()

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
    setCount('')
  }

  function onSubmit(event: SubmitEvent) {
    event.preventDefault()
    trigger({ count: count ? Number(count) : undefined }, {
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
                <Dialog.Title>Reset</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body asChild>
                <form id="resetForm" onSubmit={onSubmit}>
                  <Field.Root>
                    <Field.Label>
                      Reset with X amount of robots
                      <Field.RequiredIndicator
                        fallback={
                          <Badge size="xs" variant="surface">
                            Optional
                          </Badge>
                        }
                      />
                    </Field.Label>
                    <NumberInput.Root value={count} onValueChange={({ value }) => {setCount(value)}} min={0} width="200px" inputMode="numeric">
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
                <Button disabled={isMutating} colorPalette="green" form="resetForm" type="submit">Reset</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
