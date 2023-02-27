import { ImageProps } from "@/libs/react/props/html";

/**
 * Just an alias so Next.js doesn't throw warnings
 * @param props 
 * @returns 
 */
export function Img(props: ImageProps) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...props} />
}