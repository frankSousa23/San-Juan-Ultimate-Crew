/**
 * Utility to download or view the official 15-slide executive presentation of SIGEDIVO
 */
export async function downloadExecutivePresentationPdf() {
  try {
    const link = document.createElement('a')
    link.href = '/SIGEDIVO_Presentacion_Ejecutiva_2026.pdf'
    link.download = 'SIGEDIVO_Presentacion_Ejecutiva_2026.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Error downloading executive presentation:', err)
  }
}

export function openPresentationSlides() {
  window.open('/presentacion.html', '_blank')
}
