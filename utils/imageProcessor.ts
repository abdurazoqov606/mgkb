
/**
 * Compresses an image to reach a target size (roughly) or better.
 * Target is 800KB as requested.
 */
export const compressImage = async (
  file: File, 
  targetSizeKb: number = 800,
  maxWidth: number = 2560
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize logic if image is too large
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        
        ctx.drawImage(img, 0, 0, width, height);

        // Iterative quality adjustment to hit target size
        let quality = 0.92;
        const step = 0.08;
        const minQuality = 0.1;

        const attemptCompression = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Compression failed'));
              
              const currentSizeKb = blob.size / 1024;
              
              // If we are under target or hit min quality, we stop
              if (currentSizeKb <= targetSizeKb || q <= minQuality) {
                resolve(blob);
              } else {
                attemptCompression(q - step);
              }
            },
            'image/jpeg',
            q
          );
        };

        attemptCompression(quality);
      };
      img.onerror = () => reject(new Error('Image load error'));
    };
    reader.onerror = () => reject(new Error('File read error'));
  });
};

export const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
