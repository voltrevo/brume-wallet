export async function requestOrThrow<T>(request: IDBRequest<T>) {
  return new Promise<T>((ok, err) => {
    request.onsuccess = () => ok(request.result)
    request.onerror = () => err(request.error)
  })
}