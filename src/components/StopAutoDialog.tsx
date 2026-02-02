import {
  Button,
  CloseButton,
  Dialog,
  Portal,
} from "@chakra-ui/react"
import { useEffect } from "react"

import { useAutoStepRobots } from "@/hooks/api"
import { toaster } from "@/components/ui/toaster"

interface Props {
  open: boolean
  onClose: () => void
  stopAuto: ReturnType<typeof useAutoStepRobots>['stopAuto']
  errorMsg: ReturnType<typeof useAutoStepRobots>['errorMsg']
  isMutating: ReturnType<typeof useAutoStepRobots>['isMutating']
}

export function StopAutoDialog(props: Props) {
  const { stopAuto, errorMsg, isMutating, open } = props

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
  }

  async function onClick() {
    await stopAuto()
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
              <Dialog.Body>
                <p>
                  Are you sure that you want to stop moving the robots automatically?
                </p>
              </Dialog.Body>
              <Dialog.Footer>
                <Button disabled={isMutating} variant="outline" onClick={() => onClose()}>
                  No
                </Button>
                <Button disabled={isMutating} colorPalette="green" onClick={onClick}>Yes</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  )
}
