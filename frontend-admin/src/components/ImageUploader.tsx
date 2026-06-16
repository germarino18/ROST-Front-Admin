/**
 * ImageUploader.tsx — Componente de subida de imágenes a Cloudinary
 *
 * Maneja 5 estados: vacío, seleccionado, subiendo, completado, error.
 * Cuando el usuario quita o cambia una imagen que se subió en esta sesión,
 * la elimina automáticamente de Cloudinary (DELETE /api/v1/images/{id}).
 *
 * Uso:
 *   <ImageUploader
 *     currentUrl={producto.imagenes_url?.[0]}
 *     onUploadComplete={(url) => setImagenUrl(url)}
 *     onRemove={() => setImagenUrl('')}
 *   />
 */

import { useState, useRef } from 'react';
import { uploadImages, deleteImage } from '../api/images';

interface ImageUploaderProps {
  /** URL existente (para edición) */
  currentUrl?: string;
  /** Callback cuando la subida termina exitosamente */
  onUploadComplete: (url: string) => void;
  /** Callback opcional para cuando se quita la imagen */
  onRemove?: () => void;
}

type Status = 'empty' | 'selected' | 'uploading' | 'done' | 'error';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export default function ImageUploader({ currentUrl, onUploadComplete, onRemove }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>(currentUrl ? 'done' : 'empty');
  const [preview, setPreview] = useState<string>(currentUrl ?? '');
  const [errorMsg, setErrorMsg] = useState('');

  /**
   * uploadedImageId — ID de la última imagen subida en ESTA sesión del componente.
   * Se setea al completar un upload exitoso.
   * Se usa para borrar la imagen de Cloudinary cuando el usuario la quita o cambia.
   * NOTA: Si la URL viene de `currentUrl` (modo edición), este ID es null
   * y no se puede borrar la imagen original de Cloudinary.
   */
  const [uploadedImageId, setUploadedImageId] = useState<number | null>(null);

  /**
   * deleteCurrentImage — Borra la imagen actual de Cloudinary (si tiene ID).
   * Es fire-and-forget: si falla, no bloquea el flujo del usuario.
   */
  async function deleteCurrentImage() {
    if (uploadedImageId === null) return;
    try {
      await deleteImage(uploadedImageId);
    } catch {
      // Si falla el borrado, no bloqueamos al usuario.
      // La imagen huérfana se puede limpiar después.
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    // Validar tipo
    if (!ALLOWED_TYPES.includes(f.type)) {
      setErrorMsg('Formato no soportado. Usá JPG, PNG, GIF o WebP.');
      setStatus('error');
      return;
    }

    // Validar tamaño
    if (f.size > MAX_SIZE) {
      setErrorMsg('La imagen supera el límite de 10 MB.');
      setStatus('error');
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus('selected');
    setErrorMsg('');
  }

  async function handleUpload() {
    if (!file) return;

    // Si ya hay una imagen subida en esta sesión, la borramos de Cloudinary primero
    await deleteCurrentImage();

    setStatus('uploading');
    setErrorMsg('');

    try {
      const [image] = await uploadImages([file]);
      setPreview(image.url);
      setUploadedImageId(image.id);
      setStatus('done');
      onUploadComplete(image.url);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setErrorMsg(detail || 'Error al subir la imagen. Reintentá.');
      setStatus('error');
    }
  }

  function handleChangeImage() {
    // Abre el file picker directamente
    fileInputRef.current?.click();
  }

  async function handleRemove() {
    // Borrar de Cloudinary si tenemos el ID
    await deleteCurrentImage();

    setFile(null);
    setPreview('');
    setUploadedImageId(null);
    setStatus('empty');
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemove?.();
  }

  // ── Sub-render por estado ────────────────────────────────────────────────

  function renderPreview(src: string, faded = false) {
    return (
      <div className={`relative w-40 h-40 rounded-lg overflow-hidden border border-outline-variant ${faded ? 'opacity-50' : ''}`}>
        <img
          src={src}
          alt="Preview"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '';
            (e.target as HTMLImageElement).classList.add('hidden');
          }}
        />
      </div>
    );
  }

  function renderEmpty() {
    return (
      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex flex-col items-center justify-center w-40 h-40 rounded-lg border-2 border-dashed border-outline-variant bg-[#F5E6D3] cursor-pointer hover:bg-[#efe0cd] transition-colors"
      >
        <span className="material-symbols-outlined text-3xl text-on-surface-variant/60">add_photo_alternate</span>
        <span className="font-body text-xs text-on-surface-variant mt-1">Seleccionar imagen</span>
      </div>
    );
  }

  function renderSelected() {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-4">
          {renderPreview(preview)}
          <div className="space-y-2">
            <p className="font-body text-sm text-on-surface font-semibold">{file?.name}</p>
            <p className="font-body text-xs text-on-surface-variant">
              {(file?.size ?? 0) > 1024 * 1024
                ? `${((file?.size ?? 0) / 1024 / 1024).toFixed(1)} MB`
                : `${((file?.size ?? 0) / 1024).toFixed(0)} KB`}
            </p>
            <button
              type="button"
              onClick={handleUpload}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-container text-on-primary rounded-lg font-body text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              Subir imagen
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="block font-body text-xs text-on-surface-variant hover:text-error transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderUploading() {
    return (
      <div className="flex items-start gap-4">
        {renderPreview(preview, true)}
        <div className="flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-primary-container" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="font-body text-sm text-on-surface-variant">Subiendo imagen...</span>
          </div>
        </div>
      </div>
    );
  }

  function renderDone() {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-4">
          {renderPreview(preview)}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-green-600">check_circle</span>
              <span className="font-body text-sm text-green-700 font-semibold">Imagen subida</span>
            </div>
            <p className="font-body text-xs text-on-surface-variant max-w-[200px] break-all">{preview}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleChangeImage}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant font-body text-xs font-semibold hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                Cambiar
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-error/30 text-error font-body text-xs font-semibold hover:bg-error/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Quitar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderError() {
    return (
      <div className="space-y-3">
        {preview && (
          <div className="flex items-start gap-4">
            {renderPreview(preview)}
          </div>
        )}
        <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm font-body">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {errorMsg}
        </div>
        <div className="flex gap-2">
          {file && (
            <button
              type="button"
              onClick={handleUpload}
              className="flex items-center gap-1 px-4 py-2 bg-primary-container text-on-primary rounded-lg font-body text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Reintentar
            </button>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-body text-sm font-semibold hover:bg-surface-container-high transition-colors"
          >
            Otro archivo
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="px-4 py-2 rounded-lg text-on-surface-variant font-body text-sm hover:text-error transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // ── Render principal ─────────────────────────────────────────────────────

  return (
    <div>
      {/* File input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleSelect}
        className="hidden"
      />

      {/* Label */}
      <label className="block font-body text-sm font-semibold text-on-surface mb-2">
        Imagen del producto (opcional)
      </label>

      {/* Render por estado */}
      {status === 'empty' && renderEmpty()}
      {status === 'selected' && renderSelected()}
      {status === 'uploading' && renderUploading()}
      {status === 'done' && renderDone()}
      {status === 'error' && renderError()}
    </div>
  );
}
