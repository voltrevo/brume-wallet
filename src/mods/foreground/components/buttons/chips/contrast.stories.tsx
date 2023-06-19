import { Outline } from "@/libs/icons/icons";
import { StoryObj } from "@storybook/react";
import { ContrastButtonChip } from "./contrast";
import { InnerButtonChip } from "./naked";

const meta = { component: ContrastButtonChip }

export const hello: StoryObj<typeof meta["component"]> = {
  args: {
    children: <>
      <InnerButtonChip>
        Hello world
      </InnerButtonChip>
    </>
  }
}

export const helloWithIcon: StoryObj<typeof meta["component"]> = {
  args: {
    children: <>
      <InnerButtonChip icon={Outline.GlobeAltIcon}>
        Hello world
      </InnerButtonChip>
    </>
  }
}

export default meta