import { Outline } from "@/libs/icons/icons";
import { StoryObj } from "@storybook/react";
import { InnerButton } from "./button";
import { ContrastButton } from "./contrast";

const meta = { component: ContrastButton }

export const hello: StoryObj<typeof meta["component"]> = {
  args: {
    children: <>
      <InnerButton>
        Hello world
      </InnerButton>
    </>
  }
}

export const helloWithIcon: StoryObj<typeof meta["component"]> = {
  args: {
    children: <>
      <InnerButton icon={Outline.GlobeAltIcon}>
        Hello world
      </InnerButton>
    </>
  }
}

export default meta