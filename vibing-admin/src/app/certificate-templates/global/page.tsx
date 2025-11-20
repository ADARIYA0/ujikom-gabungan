'use client'

import React, { useState, useEffect, useRef } from 'react'
import AdminLayout from '@/components/AdminLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import GlobalCertificateTemplateService, { GlobalTemplate } from '@/services/globalCertificateTemplateService'
import { SimpleElementEditor, SimpleElement, SimpleTextElement, SimpleSignatureElement } from '@/components/certificate/SimpleElementEditor'
import {
  FileText,
  Edit,
  Plus,
  Trash2,
  Star,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  Download,
  X,
  ArrowLeft
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export default function GlobalCertificateTemplatesPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<GlobalTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<GlobalTemplate | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<GlobalTemplate | null>(null)

  // Form states
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [backgroundImage, setBackgroundImage] = useState<string>('')
  const [backgroundSize, setBackgroundSize] = useState<'cover' | 'contain' | 'auto'>('cover')
  const [isDefault, setIsDefault] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [elements, setElements] = useState<SimpleElement[]>([])
  const [selectedElementForEdit, setSelectedElementForEdit] = useState<SimpleElement | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await GlobalCertificateTemplateService.getGlobalCertificateTemplates()

      if (response.success && response.data) {
        setTemplates(response.data.templates || [])
      } else {
        setError('Gagal memuat template global')
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.message || 'Gagal memuat template',
        })
      }
    } catch (err: any) {
      console.error('Fetch Templates Error:', err)
      let errorMessage = 'Gagal memuat template global'

      if (err.message?.includes('401') || err.message?.includes('Authentication')) {
        errorMessage = 'Autentikasi gagal. Silakan login kembali.'
      } else if (err.message?.includes('403') || err.message?.includes('Forbidden')) {
        errorMessage = 'Akses ditolak. Anda memerlukan peran admin untuk mengakses template global.'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleCreateTemplate = () => {
    setIsCreating(true)
    setSelectedTemplate(null)
    setShowEditor(true)
    resetForm()
  }

  const handleEditTemplate = (template: GlobalTemplate) => {
    setIsCreating(false)
    setSelectedTemplate(template)
    setShowEditor(true)
    
    setTemplateName(template.name)
    setTemplateDescription(template.description || '')
    setBackgroundImage(template.backgroundImage || '')
    setBackgroundSize((template.backgroundSize as 'cover' | 'contain' | 'auto') || 'cover')
    setIsDefault(template.isDefault)
    setIsActive(template.isActive)
    setElements(Array.isArray(template.elements) ? template.elements : [])
  }

  const handleDeleteClick = (template: GlobalTemplate) => {
    setTemplateToDelete(template)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return

    try {
      const response = await GlobalCertificateTemplateService.deleteGlobalCertificateTemplate(templateToDelete.id)

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Template berhasil dihapus',
        })
        setShowDeleteDialog(false)
        setTemplateToDelete(null)
        await fetchTemplates()
      } else {
        throw new Error(response.message || 'Gagal menghapus template')
      }
    } catch (err: any) {
      console.error('Delete template error:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Gagal menghapus template',
      })
    }
  }

  const handleSetDefault = async (template: GlobalTemplate) => {
    try {
      const response = await GlobalCertificateTemplateService.setDefaultGlobalCertificateTemplate(template.id)

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: 'Template berhasil diatur sebagai default',
        })
        await fetchTemplates()
      } else {
        throw new Error(response.message || 'Gagal mengatur template default')
      }
    } catch (err: any) {
      console.error('Set default error:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Gagal mengatur template default',
      })
    }
  }

  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          resolve(compressedDataUrl)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleBackgroundImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB before compression)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast({
          variant: 'destructive',
          title: 'File Terlalu Besar',
          description: 'Silakan pilih gambar yang lebih kecil dari 10MB',
        })
        return
      }

      setIsUploading(true)
      try {
        // Compress image to reduce base64 size
        const compressedImage = await compressImage(file, 1920, 1080, 0.85)
        setBackgroundImage(compressedImage)
        toast({
          title: 'Berhasil',
          description: 'Gambar latar belakang berhasil diunggah',
        })
      } catch (err: any) {
        console.error('Image compression error:', err)
        toast({
          variant: 'destructive',
          title: 'Error Upload',
          description: err.message || 'Gagal memproses gambar',
        })
      } finally {
        setIsUploading(false)
      }
    }
  }

  const addTextElement = (type: 'user_name' | 'event_name') => {
    // Validasi: Pastikan background image sudah diupload
    if (!backgroundImage) {
      toast({
        variant: 'destructive',
        title: 'Validasi Error',
        description: 'Silakan unggah gambar latar belakang terlebih dahulu sebelum menambahkan elemen teks',
      })
      return
    }

    const textContent = type === 'user_name' ? '[Nama Peserta]' : '[Nama Event]'

    const newElement: SimpleTextElement = {
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      text: textContent,
      position: { x: 400, y: 300 },
      fontSize: type === 'user_name' ? 32 : 24,
      fontFamily: type === 'user_name' ? 'Ephesis' : 'Great Vibes',
      color: '#000000',
      fontWeight: 'normal',
      textAlign: 'center',
      isDynamic: true,
      dynamicType: type
    }

    setElements([...elements, newElement])
    setSelectedElementForEdit(newElement)
  }

  // Check if element type already exists
  const hasElementType = (type: 'user_name' | 'event_name') => {
    return elements.some(el => 
      el.type === 'text' && 
      (el as SimpleTextElement).isDynamic && 
      (el as SimpleTextElement).dynamicType === type
    )
  }

  const resetForm = () => {
    setTemplateName('')
    setTemplateDescription('')
    setBackgroundImage('')
    setBackgroundSize('cover')
    setIsDefault(false)
    setIsActive(true)
    setElements([])
    setSelectedElementForEdit(null)
  }

  const handleSaveTemplate = async () => {
    try {
      if (!templateName.trim()) {
        toast({
          variant: 'destructive',
          title: 'Validasi Error',
          description: 'Silakan masukkan nama template',
        })
        return
      }

      if (!backgroundImage) {
        toast({
          variant: 'destructive',
          title: 'Validasi Error',
          description: 'Silakan unggah gambar latar belakang',
        })
        return
      }

      if (elements.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Validasi Error',
          description: 'Silakan tambahkan setidaknya satu elemen',
        })
        return
      }

      setIsSaving(true)

      const templateData = {
        name: templateName.trim(),
        description: templateDescription.trim(),
        backgroundImage,
        backgroundSize,
        elements,
        isDefault,
        isActive
      }

      let response
      if (isCreating) {
        response = await GlobalCertificateTemplateService.createGlobalCertificateTemplate(templateData)
      } else if (selectedTemplate) {
        response = await GlobalCertificateTemplateService.updateGlobalCertificateTemplate(
          selectedTemplate.id,
          templateData
        )
      } else {
        throw new Error('Invalid template state')
      }

      if (response.success) {
        toast({
          title: 'Berhasil',
          description: `Template berhasil ${isCreating ? 'dibuat' : 'diperbarui'}`,
        })
        setShowEditor(false)
        resetForm()
        await fetchTemplates()
      } else {
        throw new Error(response.message || 'Gagal menyimpan template')
      }
    } catch (err: any) {
      console.error('Save template error:', err)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Gagal menyimpan template',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateElement = (elementId: string, updates: Partial<SimpleElement>) => {
    const newElements = elements.map(el => 
      el.id === elementId ? { ...el, ...updates } as SimpleElement : el
    )
    setElements(newElements)
    if (selectedElementForEdit && selectedElementForEdit.id === elementId) {
      setSelectedElementForEdit({ ...selectedElementForEdit, ...updates } as SimpleElement)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  if (error && !showEditor) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchTemplates} className="bg-teal-600 hover:bg-teal-700">
              Coba Lagi
            </Button>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  if (showEditor) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isCreating ? 'Buat Template Global' : 'Edit Template Global'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isCreating ? 'Buat template sertifikat global baru' : `Mengedit: ${selectedTemplate?.name}`}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditor(false)
                  resetForm()
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Template
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <Card className="border-0 shadow-medium">
                  <CardHeader>
                    <CardTitle className="text-lg text-teal-600">Pengaturan Template</CardTitle>
                    <CardDescription>Konfigurasi template Anda</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="templateName" className="text-gray-700">
                        Nama Template *
                      </Label>
                      <Input
                        id="templateName"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Masukkan nama template..."
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="templateDescription" className="text-gray-700">
                        Deskripsi
                      </Label>
                      <Textarea
                        id="templateDescription"
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        placeholder="Masukkan deskripsi template..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="backgroundImage" className="text-gray-700">
                        Gambar Latar Belakang *
                      </Label>
                      <Input
                        id="backgroundImage"
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundImageUpload}
                        className="mt-1"
                      />
                      {isUploading && (
                        <p className="text-sm text-teal-600 mt-2">Mengunggah...</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="backgroundSize" className="text-gray-700">
                        Ukuran Latar Belakang
                      </Label>
                      <select
                        id="backgroundSize"
                        value={backgroundSize}
                        onChange={(e) => setBackgroundSize(e.target.value as 'cover' | 'contain' | 'auto')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1"
                      >
                        <option value="cover">Cover</option>
                        <option value="contain">Contain</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                        Atur sebagai Template Default
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                        Aktif
                      </Label>
                    </div>

                    <div className="pt-4 border-t">
                      <Label className="text-gray-700 mb-2 block">Tambah Elemen Teks</Label>
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!backgroundImage}
                          className={`w-full justify-start ${
                            hasElementType('user_name')
                              ? 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
                              : !backgroundImage
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          onClick={() => addTextElement('user_name')}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Nama Peserta
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!backgroundImage}
                          className={`w-full justify-start ${
                            hasElementType('event_name')
                              ? 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
                              : !backgroundImage
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          onClick={() => addTextElement('event_name')}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Nama Event
                        </Button>
                      </div>
                    </div>

                    {/* Element Properties */}
                    {selectedElementForEdit && (
                      <div className="pt-4 border-t">
                        <Label className="text-gray-700 mb-3 block">Properti Elemen</Label>
                        <div className="space-y-3">
                          {selectedElementForEdit.type === 'text' && (
                            <>
                              <div>
                                <Label className="text-xs text-gray-600">Ukuran Font</Label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="range"
                                    min="8"
                                    max="120"
                                    value={(selectedElementForEdit as SimpleTextElement).fontSize}
                                    onChange={(e) => updateElement(selectedElementForEdit.id, { fontSize: parseInt(e.target.value) })}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                  <span className="text-xs text-gray-600 w-12 text-center">
                                    {(selectedElementForEdit as SimpleTextElement).fontSize}px
                                  </span>
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs text-gray-600">Jenis Font</Label>
                                <select
                                  value={(selectedElementForEdit as SimpleTextElement).fontFamily}
                                  onChange={(e) => updateElement(selectedElementForEdit.id, { fontFamily: e.target.value })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded mt-1"
                                >
                                  <optgroup label="Font Standar">
                                    <option value="Arial">Arial</option>
                                    <option value="Georgia">Georgia</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Inter">Inter</option>
                                  </optgroup>
                                  <optgroup label="Font Cursive/Script">
                                    <option value="Ephesis">Ephesis (Elegan)</option>
                                    <option value="Dancing Script">Dancing Script</option>
                                    <option value="Great Vibes">Great Vibes</option>
                                    <option value="Allura">Allura</option>
                                  </optgroup>
                                </select>
                              </div>

                              <div>
                                <Label className="text-xs text-gray-600">Warna</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <input
                                    type="color"
                                    value={(selectedElementForEdit as SimpleTextElement).color}
                                    onChange={(e) => updateElement(selectedElementForEdit.id, { color: e.target.value })}
                                    className="w-8 h-6 border border-gray-300 rounded"
                                  />
                                  <Input
                                    type="text"
                                    value={(selectedElementForEdit as SimpleTextElement).color}
                                    onChange={(e) => updateElement(selectedElementForEdit.id, { color: e.target.value })}
                                    className="flex-1 px-2 py-1 text-xs"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs text-gray-600">Ketebalan Font</Label>
                                <select
                                  value={(selectedElementForEdit as SimpleTextElement).fontWeight}
                                  onChange={(e) => updateElement(selectedElementForEdit.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded mt-1"
                                >
                                  <option value="normal">Normal</option>
                                  <option value="bold">Bold</option>
                                </select>
                              </div>

                              <div>
                                <Label className="text-xs text-gray-600">Perataan Teks</Label>
                                <div className="flex space-x-1 mt-1">
                                  {['left', 'center', 'right'].map((align) => (
                                    <Button
                                      key={align}
                                      size="sm"
                                      variant={(selectedElementForEdit as SimpleTextElement).textAlign === align ? 'default' : 'outline'}
                                      className={`text-xs ${(selectedElementForEdit as SimpleTextElement).textAlign === align ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
                                      onClick={() => updateElement(selectedElementForEdit.id, { textAlign: align as 'left' | 'center' | 'right' })}
                                    >
                                      {align === 'left' ? 'Kiri' : align === 'center' ? 'Tengah' : 'Kanan'}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          <div className="pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs text-red-600 hover:text-red-700"
                              onClick={() => {
                                const newElements = elements.filter(el => el.id !== selectedElementForEdit.id)
                                setElements(newElements)
                                setSelectedElementForEdit(null)
                              }}
                            >
                              🗑️ Hapus Elemen
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <Button
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        onClick={handleSaveTemplate}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            {isCreating ? 'Buat Template' : 'Perbarui Template'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Canvas */}
              <div className="lg:col-span-3">
                <Card className="border-0 shadow-medium">
                  <CardHeader>
                    <CardTitle className="text-teal-600">Pratinjau Template</CardTitle>
                    <CardDescription>Desain template sertifikat global Anda</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <div
                        ref={exportRef}
                        className="relative w-full aspect-[4/3] bg-gray-50 border-2 border-gray-300 rounded-lg overflow-hidden"
                        style={{
                          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                          backgroundSize: backgroundSize,
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      >
                        {!backgroundImage && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                              <FileText className="mx-auto h-12 w-12 mb-4" />
                              <p className="text-lg font-medium">Kanvas Template Sertifikat Global</p>
                              <p className="text-sm">Unggah gambar latar belakang dan tambahkan elemen</p>
                            </div>
                          </div>
                        )}

                        <SimpleElementEditor
                          elements={elements}
                          onElementsChange={setElements}
                          canvasWidth={1200}
                          canvasHeight={800}
                          onElementSelect={(element) => setSelectedElementForEdit(element)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        </AdminLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Template Sertifikat Global</h1>
              <p className="text-gray-600 mt-1">Buat dan kelola template sertifikat yang dapat digunakan kembali</p>
            </div>
            <Button onClick={handleCreateTemplate} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="mr-2 h-4 w-4" />
              Buat Template
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow border-0 shadow-medium">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{template.name}</CardTitle>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          {template.description || 'Tidak ada deskripsi'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Dibuat: {formatDate(template.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4">
                      {template.isDefault ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                          Default
                        </span>
                      ) : template.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Tidak Aktif
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Elemen: {Array.isArray(template.elements) ? template.elements.length : 0}
                    </div>
                    <div className="flex gap-2">
                      {!template.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(template)}
                          title="Atur sebagai Default"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      {template.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          title="Ini adalah template default"
                        >
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <Edit className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      {!template.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(template)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-600 mb-2">Tidak ada template ditemukan</p>
              <p className="text-sm text-gray-500 mb-6">
                Mulai dengan membuat template sertifikat global pertama Anda
              </p>
              <Button onClick={handleCreateTemplate} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="mr-2 h-4 w-4" />
                Buat Template
              </Button>
            </div>
          )}

          {/* Delete Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Konfirmasi Penghapusan</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin menghapus template "{templateToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Hapus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
