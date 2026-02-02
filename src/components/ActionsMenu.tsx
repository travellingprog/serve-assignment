import {
  Button,
  Menu,
  Portal,
} from "@chakra-ui/react"
import { useState } from "react"
import { LuChevronDown } from "react-icons/lu"

import { MoveRobotsDialog } from "@/components/MoveRobotsDialog";
import { ResetDialog } from "@/components/ResetDialog";
import { useAutoStepRobots } from "@/hooks/api";

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
    </>
  )
}
