"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar, Clock, MapPin, Image, Award, FileText, Loader2, Users, DollarSign, Plus, X } from 'lucide-react';
import { EventApiService } from '@/services/eventService';
import { CreateEventFormData } from '@/types/event-api';
import SimpleFileUpload from './ui/simple-file-upload';
import PriceInput from './ui/price-input';
import CapacityInput from './ui/capacity-input';
import CustomValidation from './ui/custom-validation';

interface AnimatedEventFormProps {
    onSubmit: (eventData: any) => void;
    onCancel: () => void;
}

export default function AnimatedEventForm({ onSubmit, onCancel }: AnimatedEventFormProps) {
    const [formData, setFormData] = useState<Partial<CreateEventFormData>>({
        judul_kegiatan: '',
        deskripsi_kegiatan: '',
        lokasi_kegiatan: '',
        waktu_mulai: '',
        waktu_berakhir: '',
        kapasitas_peserta: 0,
        harga: 0,
        flyer_kegiatan: undefined,
        gambar_kegiatan: undefined,
        sertifikat_kegiatan: undefined
    });

    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isUnlimitedCapacity, setIsUnlimitedCapacity] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<{
        flyer_kegiatan?: File;
        gambar_kegiatan?: File;
        sertifikat_kegiatan?: File;
    }>({});
    const [showFileUploads, setShowFileUploads] = useState({
        gambar_kegiatan: false,
        flyer_kegiatan: false,
        sertifikat_kegiatan: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        
        // Validate form
        const validation = EventApiService.validateEventForm(formData);
        
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        setIsSubmitting(true);

        // Additional datetime validation
        if (formData.waktu_mulai && formData.waktu_berakhir) {
            const startDate = new Date(formData.waktu_mulai);
            const endDate = new Date(formData.waktu_berakhir);
            
            if (endDate <= startDate) {
                setErrors(prev => ({
                    ...prev,
                    waktu_berakhir: 'Waktu berakhir harus setelah waktu mulai'
                }));
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const apiData: CreateEventFormData = {
                judul_kegiatan: formData.judul_kegiatan!,
                deskripsi_kegiatan: formData.deskripsi_kegiatan!,
                lokasi_kegiatan: formData.lokasi_kegiatan!,
                waktu_mulai: formData.waktu_mulai!,
                waktu_berakhir: formData.waktu_berakhir!,
                kapasitas_peserta: isUnlimitedCapacity ? 0 : (formData.kapasitas_peserta || 0),
                harga: formData.harga || 0,
                flyer_kegiatan: selectedFiles.flyer_kegiatan,
                gambar_kegiatan: selectedFiles.gambar_kegiatan,
                sertifikat_kegiatan: selectedFiles.sertifikat_kegiatan
            };

            const response = await EventApiService.createEvent(apiData);
            
            // Backend returns filenames, construct full URLs for frontend
            const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
            
            const eventData = {
                id: response.data?.id?.toString() || Date.now().toString(),
                title: formData.judul_kegiatan!,
                description: formData.deskripsi_kegiatan!,
                location: formData.lokasi_kegiatan!,
                startDate: new Date(formData.waktu_mulai!),
                endDate: new Date(formData.waktu_berakhir!),
                capacity: isUnlimitedCapacity ? 0 : (formData.kapasitas_peserta || 0),
                price: formData.harga || 0,
                status: 'upcoming' as const,
                imageUrl: (response.data as any)?.gambar_kegiatan 
                    ? `${BASE_URL?.replace(/\/$/, '') || ''}/uploads/events/${(response.data as any).gambar_kegiatan}`
                    : '/placeholder-event.jpg',
                flyer: (response.data as any)?.flyer_kegiatan 
                    ? `${BASE_URL?.replace(/\/$/, '') || ''}/uploads/flyer/${(response.data as any).flyer_kegiatan}`
                    : '',
                certificate: (response.data as any)?.sertifikat_kegiatan 
                    ? `${BASE_URL?.replace(/\/$/, '') || ''}/uploads/certificates/${(response.data as any).sertifikat_kegiatan}`
                    : '',
                participants: 0,
                time: new Date(formData.waktu_mulai!).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }),
                date: new Date(formData.waktu_mulai!),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            onSubmit(eventData);
            setFormData({
                judul_kegiatan: '',
                deskripsi_kegiatan: '',
                lokasi_kegiatan: '',
                waktu_mulai: '',
                waktu_berakhir: '',
                kapasitas_peserta: 0,
                harga: 0,
                flyer_kegiatan: undefined,
                gambar_kegiatan: undefined,
                sertifikat_kegiatan: undefined
            });
            setSelectedFiles({});
            setIsUnlimitedCapacity(false);
            setShowFileUploads({
                gambar_kegiatan: false,
                flyer_kegiatan: false,
                sertifikat_kegiatan: false
            });
            setErrors({});
        } catch (error) {
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'number') {
            setFormData({
                ...formData,
                [name]: value === '' ? 0 : Number(value)
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    const handleFileSelected = (fieldName: string, file: File) => {
        setSelectedFiles(prev => ({
            ...prev,
            [fieldName]: file
        }));
        
        // Clear error when file is selected
        if (errors[fieldName]) {
            setErrors(prev => ({
                ...prev,
                [fieldName]: ''
            }));
        }
    };

    const handleFileRemoved = (fieldName: string) => {
        setSelectedFiles(prev => {
            const updated = { ...prev };
            delete updated[fieldName as keyof typeof updated];
            return updated;
        });
    };

    const toggleFileUpload = (fieldName: keyof typeof showFileUploads) => {
        setShowFileUploads(prev => ({
            ...prev,
            [fieldName]: !prev[fieldName]
        }));
        
        // If hiding, also remove the selected file
        if (showFileUploads[fieldName]) {
            handleFileRemoved(fieldName);
        }
    };

    const handleCapacityToggle = (unlimited: boolean) => {
        setIsUnlimitedCapacity(unlimited);
        if (unlimited) {
            setFormData(prev => ({
                ...prev,
                kapasitas_peserta: 0
            }));
        }
    };

    const handleFocus = (fieldName: string) => {
        setFocusedField(fieldName);
    };

    const handleBlur = () => {
        setFocusedField(null);
    };

    const handleCancel = () => {
        setIsClosing(true);
        // Let CSS animation handle the timing, then call onCancel
        setTimeout(() => {
            onCancel();
        }, 150); // Match CSS animation duration (0.15s)
    };

    const getFieldClasses = (fieldName: string, focusColor: string) => {
        const isFocused = focusedField === fieldName;
        const hasError = errors[fieldName];
        const hasValue = formData[fieldName as keyof typeof formData];

        return `w-full h-11 px-3 py-2 border rounded-md transition-all duration-200 ease-in-out ${hasError
                ? 'border-red-500 focus:border-red-500'
                : isFocused
                    ? focusColor
                    : hasValue
                        ? 'border-teal-300'
                        : 'border-gray-200 hover:border-teal-300'
            }`;
    };

    const getLabelClasses = (fieldName: string) => {
        const isFocused = focusedField === fieldName;
        const hasValue = formData[fieldName as keyof typeof formData];

        return `flex items-center gap-2 text-sm font-medium mb-2 transition-all duration-200 ease-in-out ${isFocused || hasValue ? 'text-teal-600' : 'text-gray-700'
            }`;
    };

    return (
        <div className="space-y-6 p-6 max-w-full overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-full">
                <div className="transform transition-all duration-200 ease-in-out hover:translate-y-[-1px]">
                    <Label htmlFor="judul_kegiatan" className={getLabelClasses('judul_kegiatan')}>
                        <FileText className={`h-4 w-4 transition-colors duration-200 ${focusedField === 'judul_kegiatan' ? 'text-teal-600' : 'text-teal-500'
                            }`} />
                        Judul Kegiatan/Event *
                    </Label>
                    <Input
                        id="judul_kegiatan"
                        name="judul_kegiatan"
                        value={formData.judul_kegiatan || ''}
                        onChange={handleChange}
                        onFocus={() => handleFocus('judul_kegiatan')}
                        onBlur={handleBlur}
                        placeholder="Masukkan judul event"
                        disabled={isSubmitting}
                        className={getFieldClasses('judul_kegiatan', 'focus:border-teal-500')}
                    />
                    {errors.judul_kegiatan && (
                        <CustomValidation message={errors.judul_kegiatan} />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="transform transition-all duration-200 ease-in-out hover:translate-y-[-1px]">
                        <Label htmlFor="waktu_mulai" className={getLabelClasses('waktu_mulai')}>
                            <Calendar className={`h-4 w-4 transition-colors duration-200 ${focusedField === 'waktu_mulai' ? 'text-teal-600' : 'text-teal-500'
                                }`} />
                            Waktu Mulai *
                        </Label>
                        <Input
                            id="waktu_mulai"
                            name="waktu_mulai"
                            type="datetime-local"
                            value={formData.waktu_mulai || ''}
                            onChange={handleChange}
                            onFocus={() => handleFocus('waktu_mulai')}
                            onBlur={handleBlur}
                            disabled={isSubmitting}
                            className={getFieldClasses('waktu_mulai', 'focus:border-teal-500')}
                        />
                        {errors.waktu_mulai && (
                            <CustomValidation message={errors.waktu_mulai} />
                        )}
                    </div>
                    <div className="transform transition-all duration-200 ease-in-out hover:translate-y-[-1px]">
                        <Label htmlFor="waktu_berakhir" className={getLabelClasses('waktu_berakhir')}>
                            <Clock className={`h-4 w-4 transition-colors duration-200 ${focusedField === 'waktu_berakhir' ? 'text-teal-600' : 'text-teal-500'
                                }`} />
                            Waktu Berakhir *
                        </Label>
                        <Input
                            id="waktu_berakhir"
                            name="waktu_berakhir"
                            type="datetime-local"
                            value={formData.waktu_berakhir || ''}
                            onChange={handleChange}
                            onFocus={() => handleFocus('waktu_berakhir')}
                            onBlur={handleBlur}
                            disabled={isSubmitting}
                            className={getFieldClasses('waktu_berakhir', 'focus:border-teal-500')}
                        />
                        {errors.waktu_berakhir && (
                            <CustomValidation message={errors.waktu_berakhir} />
                        )}
                    </div>
                </div>

                <div className="transform transition-all duration-200 ease-in-out hover:translate-y-[-1px]">
                    <Label htmlFor="lokasi_kegiatan" className={getLabelClasses('lokasi_kegiatan')}>
                        <MapPin className={`h-4 w-4 transition-colors duration-200 ${focusedField === 'lokasi_kegiatan' ? 'text-teal-600' : 'text-teal-500'
                            }`} />
                        Lokasi Event *
                    </Label>
                    <Input
                        id="lokasi_kegiatan"
                        name="lokasi_kegiatan"
                        value={formData.lokasi_kegiatan || ''}
                        onChange={handleChange}
                        onFocus={() => handleFocus('lokasi_kegiatan')}
                        onBlur={handleBlur}
                        placeholder="Masukkan lokasi event"
                        disabled={isSubmitting}
                        className={getFieldClasses('lokasi_kegiatan', 'focus:border-teal-500')}
                    />
                    {errors.lokasi_kegiatan && (
                        <CustomValidation message={errors.lokasi_kegiatan} />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="transform transition-all duration-200 ease-in-out hover:translate-y-[-1px]">
                        <Label className={getLabelClasses('kapasitas_peserta')}>
                            <Users className={`h-4 w-4 transition-colors duration-200 ${focusedField === 'kapasitas_peserta' ? 'text-teal-600' : 'text-teal-500'
                                }`} />
                            Kapasitas Peserta
                        </Label>
                        
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleCapacityToggle(false)}
                                    className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                                        !isUnlimitedCapacity 
                                            ? 'bg-teal-50 border-teal-300 text-teal-700 shadow-sm' 
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                    }`}
                                    disabled={isSubmitting}
                                >
                                    Terbatas
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCapacityToggle(true)}
                                    className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                                        isUnlimitedCapacity 
                                            ? 'bg-teal-50 border-teal-300 text-teal-700 shadow-sm' 
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                    }`}
                                    disabled={isSubmitting}
                                >
                                    Tidak Terbatas
                                </button>
                            </div>

                            {!isUnlimitedCapacity ? (
                                <CapacityInput
                                    id="kapasitas_peserta"
                                    name="kapasitas_peserta"
                                    value={formData.kapasitas_peserta || 0}
                                    onChange={(value) => setFormData(prev => ({ ...prev, kapasitas_peserta: value }))}
                                    onFocus={() => handleFocus('kapasitas_peserta')}
                                    onBlur={handleBlur}
                                    placeholder="Masukkan jumlah peserta"
                                    disabled={isSubmitting}
                                    error={errors.kapasitas_peserta}
                                    isFocused={focusedField === 'kapasitas_peserta'}
                                    min={1}
                                />
                            ) : (
                                <div className="p-4 bg-gradient-to-r from-teal-50 to-teal-100 border-2 border-teal-200 rounded-lg">
                                    <div className="flex items-center justify-center space-x-2">
                                        <span className="text-2xl text-teal-600">∞</span>
                                        <span className="text-base font-medium text-teal-700">Tidak terbatas</span>
                                    </div>
                                    <p className="text-xs text-teal-600 text-center mt-2">
                                        Event dapat diikuti tanpa batasan peserta
                                    </p>
                                </div>
                            )}
                        </div>

                        {errors.kapasitas_peserta && (
                            <CustomValidation message={errors.kapasitas_peserta} />
                        )}
                    </div>
                    
                    <div className="transform transition-all duration-200 ease-in-out hover:translate-y-[-1px]">
                        <Label htmlFor="harga" className={getLabelClasses('harga')}>
                            <DollarSign className={`h-4 w-4 transition-colors duration-200 ${focusedField === 'harga' ? 'text-teal-600' : 'text-teal-500'
                                }`} />
                            Harga (Rp)
                        </Label>
                        <PriceInput
                            id="harga"
                            name="harga"
                            value={formData.harga || 0}
                            onChange={(value) => setFormData(prev => ({ ...prev, harga: value }))}
                            onFocus={() => handleFocus('harga')}
                            onBlur={handleBlur}
                            placeholder="0"
                            disabled={isSubmitting}
                            error={errors.harga}
                            isFocused={focusedField === 'harga'}
                        />
                        <p className="text-xs text-gray-500 text-right mt-1">
                            Kosongkan atau isi 0 untuk event gratis
                        </p>
                        {errors.harga && (
                            <CustomValidation message={errors.harga} />
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Mau menambahkan file untuk event?
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Button
                                type="button"
                                variant={showFileUploads.gambar_kegiatan ? "default" : "outline"}
                                onClick={() => toggleFileUpload('gambar_kegiatan')}
                                disabled={isSubmitting}
                                className={`h-auto py-3 px-4 flex flex-col items-center gap-2 ${
                                    showFileUploads.gambar_kegiatan 
                                        ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                                        : 'border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Image className="h-5 w-5" />
                                <span className="text-xs font-medium">Gambar Event</span>
                                <span className="text-xs opacity-75">JPG, PNG, WebP</span>
                            </Button>

                            <Button
                                type="button"
                                variant={showFileUploads.flyer_kegiatan ? "default" : "outline"}
                                onClick={() => toggleFileUpload('flyer_kegiatan')}
                                disabled={isSubmitting}
                                className={`h-auto py-3 px-4 flex flex-col items-center gap-2 ${
                                    showFileUploads.flyer_kegiatan 
                                        ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                                        : 'border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <FileText className="h-5 w-5" />
                                <span className="text-xs font-medium">Flyer Event</span>
                                <span className="text-xs opacity-75">JPG, PNG, WebP</span>
                            </Button>

                            <Button
                                type="button"
                                variant={showFileUploads.sertifikat_kegiatan ? "default" : "outline"}
                                onClick={() => toggleFileUpload('sertifikat_kegiatan')}
                                disabled={isSubmitting}
                                className={`h-auto py-3 px-4 flex flex-col items-center gap-2 ${
                                    showFileUploads.sertifikat_kegiatan 
                                        ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                                        : 'border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <Award className="h-5 w-5" />
                                <span className="text-xs font-medium">Sertifikat</span>
                                <span className="text-xs opacity-75">Template sertifikat</span>
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {showFileUploads.gambar_kegiatan && (
                            <div className="transform transition-all duration-200 ease-in-out hover:translate-y-[-1px] animate-in slide-in-from-top-2 fade-in-0">
                                <SimpleFileUpload
                                    label="Gambar Event"
                                    accept={['.jpg', '.jpeg', '.png', '.webp']}
                                    onFileSelected={(file) => handleFileSelected('gambar_kegiatan', file)}
                                    onFileRemoved={() => handleFileRemoved('gambar_kegiatan')}
                                    currentFile={selectedFiles.gambar_kegiatan}
                                    disabled={isSubmitting}
                                    error={errors.gambar_kegiatan}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Hanya file gambar (JPG, PNG, WebP) yang diizinkan. Maksimal 10MB.
                                </p>
                            </div>
                        )}

                        {showFileUploads.flyer_kegiatan && (
                            <div className="transform transition-all duration-200 ease-in-out hover:translate-y-[-1px] animate-in slide-in-from-top-2 fade-in-0">
                                <SimpleFileUpload
                                    label="Flyer Event"
                                    accept={['.jpg', '.jpeg', '.png', '.webp']}
                                    onFileSelected={(file) => handleFileSelected('flyer_kegiatan', file)}
                                    onFileRemoved={() => handleFileRemoved('flyer_kegiatan')}
                                    currentFile={selectedFiles.flyer_kegiatan}
                                    disabled={isSubmitting}
                                    error={errors.flyer_kegiatan}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Hanya file gambar (JPG, PNG, WebP) yang diizinkan. Maksimal 10MB.
                                </p>
                            </div>
                        )}

                        {showFileUploads.sertifikat_kegiatan && (
                            <div className="transform transition-all duration-200 ease-in-out hover:translate-y-[-1px] animate-in slide-in-from-top-2 fade-in-0">
                                <SimpleFileUpload
                                    label="Template Sertifikat"
                                    accept={['.jpg', '.jpeg', '.png', '.webp']}
                                    onFileSelected={(file) => handleFileSelected('sertifikat_kegiatan', file)}
                                    onFileRemoved={() => handleFileRemoved('sertifikat_kegiatan')}
                                    currentFile={selectedFiles.sertifikat_kegiatan}
                                    disabled={isSubmitting}
                                    error={errors.sertifikat_kegiatan}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Hanya file gambar (JPG, PNG, WebP) yang diizinkan. Maksimal 10MB.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="transform transition-all duration-200 ease-in-out hover:translate-y-[-1px]">
                    <Label htmlFor="deskripsi_kegiatan" className={getLabelClasses('deskripsi_kegiatan')}>
                        <FileText className={`h-4 w-4 transition-colors duration-200 ${focusedField === 'deskripsi_kegiatan' ? 'text-teal-600' : 'text-teal-500'
                            }`} />
                        Deskripsi Event *
                    </Label>
                    <Textarea
                        id="deskripsi_kegiatan"
                        name="deskripsi_kegiatan"
                        value={formData.deskripsi_kegiatan || ''}
                        onChange={handleChange}
                        onFocus={() => handleFocus('deskripsi_kegiatan')}
                        onBlur={handleBlur}
                        placeholder="Deskripsikan event Anda secara detail..."
                        rows={4}
                        disabled={isSubmitting}
                        className={`${getFieldClasses('deskripsi_kegiatan', 'focus:border-teal-500')} resize-none h-24`}
                    />
                    {errors.deskripsi_kegiatan && (
                        <CustomValidation message={errors.deskripsi_kegiatan} />
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white font-medium transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Membuat Event...
                            </>
                        ) : (
                            <>
                                <Plus className="h-5 w-5 mr-2" />
                                Buat Event
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting || isClosing}
                        className="flex-1 h-12 border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                        {isClosing ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Menutup...
                            </>
                        ) : (
                            <>
                                <X className="h-5 w-5 mr-2" />
                                Batal
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
