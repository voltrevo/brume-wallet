import { Result } from "@hazae41/xswr";

export async function wrap<T>(callback: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await callback()
    return { data }
  } catch (error: unknown) {
    return { error }
  }
}