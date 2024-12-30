'use client'

import { useState } from 'react'
import Image from 'next/image'
import { uploadProductImage, deleteProductImage } from '@/services/upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ProductImageUploadProps {
  productId: string
  currentImageUrl?: string | null
}

export function ProductImageUpload({ 
  productId, 
  currentImageUrl 
}: ProductImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Selecione uma imagem')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const uploadedUrl = await uploadProductImage(selectedFile, productId)
      setPreviewUrl(uploadedUrl)
      setSelectedFile(null)
    } catch (err) {
      setError(String(err))
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover esta imagem?')) return

    setIsUploading(true)
    setError(null)

    try {
      await deleteProductImage(productId)
      setPreviewUrl(null)
      setSelectedFile(null)
    } catch (err) {
      setError(String(err))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Input 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? 'Enviando...' : 'Enviar Imagem'}
        </Button>
        {previewUrl && (
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={isUploading}
          >
            Remover
          </Button>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {previewUrl && (
        <div className="mt-4">
          <Image 
            src={previewUrl} 
            alt="Imagem do Produto" 
            width={200} 
            height={200} 
            className="rounded-lg object-cover"
          />
        </div>
      )}
    </div>
  )
}
