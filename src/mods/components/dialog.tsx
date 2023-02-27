import { Events } from "@/libs/react/events";
import { ChildrenProps } from "@/libs/react/props/children";
import { CloseProps } from "@/libs/react/props/close";
import { Modal } from "./modal";

export function Dialog(props: CloseProps & ChildrenProps) {
  const { close, children } = props

  return <Modal>
    <div className="p-4 fixed inset-0 bg-backdrop animate-opacity"
      onMouseDown={close}
      onClick={Events.keep}>
      <div className="p-4 h-full flex flex-col rounded-xl bg-default animate-opacity-scale"
        onMouseDown={Events.keep}>
        {children}
      </div>
    </div>
  </Modal>
}