export function alertAsJson(e: unknown) {
  console.error(e)

  if (e instanceof Error)
    alert(e.message)
  else
    alert(e)
}