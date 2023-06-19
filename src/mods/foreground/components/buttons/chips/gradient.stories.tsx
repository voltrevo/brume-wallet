import { Outline } from "@/libs/icons/icons";
import { StoryObj } from "@storybook/react";
import { GradientButtonChip } from "./gradient";
import { InnerButtonChip } from "./naked";

const meta = { component: GradientButtonChip }

export const hello: StoryObj<typeof meta["component"]> = {
  args: {
    colorIndex: 5,
    children: <>
      <InnerButtonChip>
        Hello world
      </InnerButtonChip>
    </>
  }
}

export const helloWithIcon: StoryObj<typeof meta["component"]> = {
  args: {
    colorIndex: 5,
    children: <>
      <InnerButtonChip icon={Outline.GlobeAltIcon}>
        Hello world
      </InnerButtonChip>
    </>
  }
}

export default meta