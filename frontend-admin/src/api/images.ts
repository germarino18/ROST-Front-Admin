/**
 * images.ts — API de imágenes (Cloudinary)
 *
 * POST /api/v1/images/upload → Sube archivos a Cloudinary y devuelve las URLs.
 * DELETE /api/v1/images/{id} → Elimina una imagen de Cloudinary y la DB.
 * El endpoint require rol ADMIN (el interceptor 401 redirige a login si expiró).
 */

import api from './client';
import type { ImagePublic } from '../types';

/**
 * uploadImages — Sube uno o más archivos a Cloudinary.
 *
 * @param files - Archivos a subir (FileList o File[])
 * @returns Promise<ImagePublic[]> - Array con los registros de imágenes creadas
 *
 * Uso:
 *   const [image] = await uploadImages([file]);
 *   const url = image.url;  // → URL lista para guardar en el producto
 */
export async function uploadImages(files: File[]): Promise<ImagePublic[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const res = await api.post<ImagePublic[]>('/images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    // Timeout más largo para subida de archivos (2 minutos)
    timeout: 120_000,
  });

  return res.data;
}

/**
 * deleteImage — Elimina una imagen de Cloudinary y de la DB.
 *
 * @param id - ID de la imagen en la tabla `images`
 *
 * Uso:
 *   await deleteImage(image.id);
 */
export async function deleteImage(id: number): Promise<void> {
  await api.delete(`/images/${id}`);
}
