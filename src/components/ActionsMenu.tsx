import {
  Button,
  Menu,
  Portal,
} from "@chakra-ui/react"
import { useState } from "react"
import { LuChevronDown } from "react-icons/lu"

import { MoveRobotsDialog } from "@/components/MoveRobotsDialog";
import { ResetDialog } from "@/components/ResetDialog";
import { StartAutoDialog } from "@/components/StartAutoDialog";
import { StopAutoDialog } from "@/components/StopAutoDialog";
import { useAutoStepRobots } from "@/hooks/api";

/** Our menu of possible actions that the user can take */
export function ActionsMenu() {
  const [dialog, setDialog] = useState<string | null>(null)
  const autoStepRobots = useAutoStepRobots()

  return (
    <>
      <Menu.Root onSelect={(details) => {
        setDialog(details.value)
      }}>
        <Menu.Trigger asChild>
          <Button variant="solid" position="fixed" top="4" left="4" zIndex={10}>
            Actions <LuChevronDown />
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              {autoStepRobots.autoEnabled ? (
                <Menu.Item value="stopAuto">Stop Auto-Step</Menu.Item>
              ) : (
                <>
                  <Menu.Item value="move">Move Robots</Menu.Item>
                  <Menu.Item value="startAuto">Start Auto-Step</Menu.Item>
                  <Menu.Item value="reset">Reset</Menu.Item>
                </>
              )}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      <MoveRobotsDialog open={dialog === 'move'} onClose={() => setDialog(null)} />

      <ResetDialog open={dialog === 'reset'} onClose={() => setDialog(null)} />

      <StartAutoDialog
        open={dialog === 'startAuto'}
        onClose={() => setDialog(null)}
        startAuto={autoStepRobots.startAuto}
        errorMsg={autoStepRobots.errorMsg}
        isMutating={autoStepRobots.isMutating}
      />

      <StopAutoDialog
        open={dialog === 'stopAuto'}
        onClose={() => setDialog(null)}
        stopAuto={autoStepRobots.stopAuto}
        errorMsg={autoStepRobots.errorMsg}
        isMutating={autoStepRobots.isMutating}
      />
    </>
  )
}
