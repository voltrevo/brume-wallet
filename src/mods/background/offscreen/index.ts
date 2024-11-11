import { browser } from "@/libs/browser/browser"

const background = browser!.runtime.connect({ name: "offscreen->background" })