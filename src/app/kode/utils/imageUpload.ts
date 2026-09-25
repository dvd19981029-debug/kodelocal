/**
 * Utilidades para procesamiento, compresión y subida de imágenes de comprobantes KÖDE
 */

export const compressAndUploadImage = async (file: File | Blob): Promise<string> => {
  const compressedBlob = await new Promise<Blob>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new (window as any).Image();
      img.onload = () => {
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file instanceof Blob ? file : new Blob([file]));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else resolve(file instanceof Blob ? file : new Blob([file]));
          },
          'image/jpeg',
          0.82
        );
      };
      img.onerror = () => resolve(file instanceof Blob ? file : new Blob([file]));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file instanceof Blob ? file : new Blob([file]));
    reader.readAsDataURL(file);
  });

  const fd = new FormData();
  fd.append('file', compressedBlob, 'comprobante.jpg');
  const res = await fetch('/api/kode/pagos/upload-comprobante', {
    method: 'POST',
    body: fd,
  });
  const data = await res.json();
  if (!data.success || !data.url) {
    throw new Error(data.error || 'No se pudo subir la imagen del comprobante');
  }
  return data.url;
};
