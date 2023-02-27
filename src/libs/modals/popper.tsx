import { useBoolean } from "@/libs/react/handles/boolean"
import { useElement } from "@/libs/react/handles/element"
import { ChildrenProps } from "@/libs/react/props/children"
import { TargetProps } from "@/libs/react/props/target"
import { Options } from "@popperjs/core"
import { usePopper } from "react-popper"
import { Modal } from "./modal"

export namespace Poppers {

  export const noOffset: Options = {
    placement: "bottom",
    strategy: "fixed",
    modifiers: [{
      name: 'offset',
      options: {
        offset: [0, 5],
      },
    }]
  }

}

export function HoverPopper(props: TargetProps & ChildrenProps) {
  const { children, target } = props

  const element = useElement<HTMLDivElement>()
  const popper = usePopper(target.current, element.current, Poppers.noOffset)

  const hovered = useBoolean()

  if (!hovered.current && !target.current)
    return null

  return <Modal>
    <div className="fixed px-2"
      style={popper.styles.popper}
      {...popper.attributes.popper}
      onMouseEnter={hovered.enable}
      onMouseLeave={hovered.disable}
      ref={element.set}>
      <div className="p-2 bg-violet2 border border-default rounded-xl animate-slidedown text-xs">
        {children}
      </div>
    </div>
  </Modal>
}