export default function isPdfFile(extension?: string) {
  if (!extension) {
    return false;
  }
  return extension.toLowerCase() === 'pdf';
}
