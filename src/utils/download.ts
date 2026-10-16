/**
 * Triggers a real browser file download from DataURL or text/binary content.
 * Converts to Blob URL to ensure modern browsers (Chrome/Firefox/Safari)
 * execute the download without data: URI restrictions.
 */
export function downloadSaveFile(fileName: string, fileData: string): void {
  try {
    let blob: Blob;

    if (fileData.startsWith('data:')) {
      const parts = fileData.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const isBase64 = parts[0].includes('base64');
      const bstr = isBase64 ? atob(parts[1]) : decodeURIComponent(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    } else {
      blob = new Blob([fileData], { type: 'application/octet-stream' });
    }

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
  } catch (err) {
    console.error('Erreur lors du téléchargement de la sauvegarde:', err);
    try {
      const link = document.createElement('a');
      link.href = fileData;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e2) {
      console.error('Fallback échoué:', e2);
    }
  }
}
