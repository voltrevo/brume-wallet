export namespace Mime {

  export function isImage(mime: string) {
    if (mime === "image/gif")
      return true
    if (mime === "image/jpeg")
      return true
    if (mime === "image/png")
      return true
    if (mime === "image/tiff")
      return true
    if (mime === "image/vnd.microsoft.icon")
      return true
    if (mime === "image/x-icon")
      return true
    if (mime === "image/vnd.djvu")
      return true
    if (mime === "image/svg+xml")
      return true
    return false
  }
}