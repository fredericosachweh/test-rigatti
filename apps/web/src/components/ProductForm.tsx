import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../lib/api";

export interface ProductImage {
  imageUrl: string;
  thumbnailUrl?: string;
}

export interface ProductInput {
  name: string;
  description: string;
  price: string;
  category: string;
  images: ProductImage[];
}

interface ProductFormProps {
  initialValue?: ProductInput;
  onSubmit: (payload: ProductInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel: string;
}

const MAX_IMAGES = 6;

const EMPTY_FORM: ProductInput = {
  name: "",
  description: "",
  price: "",
  category: "",
  images: []
};

function resolvePreview(url: string): string {
  return url.startsWith("/uploads") ? `${API_URL}${url}` : url;
}

export function ProductForm({ initialValue, onSubmit, onCancel, submitLabel }: ProductFormProps) {
  const { token } = useAuth();
  const [form, setForm] = useState<ProductInput>(initialValue ?? EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingSlotRef = useRef<number | null>(null);

  useEffect(() => {
    setForm(initialValue ?? EMPTY_FORM);
    setUploadError("");
  }, [initialValue]);

  function openFilePicker(slotIndex: number) {
    uploadingSlotRef.current = slotIndex;
    const isReplace = slotIndex < form.images.length;
    if (fileInputRef.current) {
      fileInputRef.current.multiple = !isReplace;
      fileInputRef.current.click();
    }
  }

  async function uploadFile(file: File): Promise<ProductImage> {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`${API_URL}/upload/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(err.message ?? "Falha no upload.");
    }
    return res.json() as Promise<ProductImage>;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const slot = uploadingSlotRef.current!;
    const isReplace = slot < form.images.length; // trocar imagem existente
    setUploadingIndex(slot);
    setUploadError("");

    try {
      if (isReplace) {
        // Substituir slot específico — usa apenas o primeiro arquivo
        const uploaded = await uploadFile(files[0]);
        setForm((current) => {
          const imgs = [...current.images];
          imgs[slot] = uploaded;
          return { ...current, images: imgs };
        });
      } else {
        // Adicionar múltiplos arquivos a partir do slot atual
        const current = form.images;
        const available = MAX_IMAGES - current.length;
        const toUpload = files.slice(0, available);

        if (toUpload.length < files.length) {
          setUploadError(
            `Limite de ${MAX_IMAGES} imagens. ${files.length - toUpload.length} arquivo(s) ignorado(s).`
          );
        }

        const results = await Promise.all(toUpload.map(uploadFile));
        setForm((c) => ({ ...c, images: [...c.images, ...results] }));
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro no upload.");
    } finally {
      setUploadingIndex(null);
    }
  }

  function removeImage(index: number) {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, i) => i !== index)
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (form.images.length === 0) {
      setUploadError("Adicione ao menos uma imagem.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      setForm(EMPTY_FORM);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Slots: existing images + one empty slot (if < MAX_IMAGES)
  const slots = [...form.images, ...(form.images.length < MAX_IMAGES ? [null] : [])];

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Admin Studio</p>
          <h3>{initialValue ? "Editar tratamento" : "Novo tratamento"}</h3>
        </div>
        {onCancel ? (
          <button className="ghost-button" onClick={onCancel} type="button">
            Cancelar
          </button>
        ) : null}
      </div>

      {/* Multi-image upload */}
      <div className="image-upload-field">
        <span className="field-label">
          Imagens ({form.images.length}/{MAX_IMAGES})
        </span>
        <div className="image-slots">
          {slots.map((img, i) =>
            img ? (
              <div key={i} className="image-slot image-slot--filled">
                <img
                  src={resolvePreview(img.thumbnailUrl ?? img.imageUrl)}
                  alt={`Imagem ${i + 1}`}
                  className="image-slot-thumb"
                />
                {i === 0 && <span className="image-slot-badge">Capa</span>}
                <button
                  className="image-slot-remove"
                  onClick={() => removeImage(i)}
                  type="button"
                  aria-label="Remover"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <button
                  className="image-slot-replace"
                  onClick={() => openFilePicker(i)}
                  type="button"
                  aria-label="Trocar"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </button>
                {uploadingIndex === i && (
                  <div className="image-slot-loading">
                    <span>Enviando...</span>
                  </div>
                )}
              </div>
            ) : (
              <button
                key="add"
                className={`image-slot image-slot--empty ${uploadingIndex === form.images.length ? "image-slot--loading" : ""}`}
                onClick={() => openFilePicker(form.images.length)}
                type="button"
                disabled={uploadingIndex !== null}
              >
                {uploadingIndex === form.images.length ? (
                  <span className="image-slot-uploading-text">Enviando...</span>
                ) : (
                  <>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Adicionar</span>
                  </>
                )}
              </button>
            )
          )}
        </div>
        {uploadError && <span className="field-error">{uploadError}</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <label className="field">
        <span>Nome</span>
        <input
          value={form.name}
          onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
          placeholder="Ex.: Toxina Botulínica Facial"
          required
        />
      </label>

      <label className="field">
        <span>Descrição</span>
        <textarea
          value={form.description}
          onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
          placeholder="Descreva o tratamento..."
          rows={4}
          required
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Preço (R$)</span>
          <input
            value={form.price}
            onChange={(e) => setForm((c) => ({ ...c, price: e.target.value }))}
            placeholder="1200.00"
            type="number"
            min="0"
            step="0.01"
            required
          />
        </label>
        <label className="field">
          <span>Categoria</span>
          <input
            value={form.category}
            onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))}
            placeholder="Facial"
            required
          />
        </label>
      </div>

      <button
        className="primary-button"
        disabled={isSubmitting || uploadingIndex !== null}
        type="submit"
      >
        {isSubmitting ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
