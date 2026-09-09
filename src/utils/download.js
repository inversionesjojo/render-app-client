/**
 * Utility to download files (images, videos, 3D STL models)
 * securely and reliably cross-origin.
 */
export async function downloadResource(url, filename = 'archivo') {
  if (!url) return

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP error ${response.status}`)
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl)
    }, 1500)
    return true
  } catch (err) {
    console.warn('Cross-origin blob download failed, falling back to direct anchor:', err)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true
  }
}
