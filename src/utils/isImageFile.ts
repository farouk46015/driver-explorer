export default function isImageFile(extension?: string) {
  if (!extension) {
    return false;
  }
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  return imageExtensions.includes(extension.toLowerCase());
}
