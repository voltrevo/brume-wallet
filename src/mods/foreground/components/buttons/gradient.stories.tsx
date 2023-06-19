import { Outline } from "@/libs/icons/icons";
import { StoryObj } from "@storybook/react";
import { InnerButton } from "./button";
import { GradientButton } from "./gradient";

const meta = { component: GradientButton }

export const hello: StoryObj<typeof meta["component"]> = {
  args: {
    colorIndex: 5,
    children: <>
      <InnerButton>
        Hello world
      </InnerButton>
    </>
  }
}

export const helloWithIcon: StoryObj<typeof meta["component"]> = {
  args: {
    colorIndex: 5,
    children: <>
      <InnerButton icon={Outline.GlobeAltIcon}>
        Hello world
      </InnerButton>
    </>
  }
}

export default meta