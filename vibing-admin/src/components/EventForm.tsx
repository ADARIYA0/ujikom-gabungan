"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar, Clock, MapPin, Image, Award, FileText } from 'lucide-react';

interface EventFormData {
  title: string;
  date: string;
  time: string;
  location: string;
  flyer: string;
  certificate: string;
  description: string;
}

interface EventFormProps {
  onSubmit: (eventData: EventFormData & { 
    id: string; 
    participants: number; 
    status: 'upcoming' | 'ongoing' | 'completed';
  }) => void;
  onCancel: () => void;
}

export default function EventForm({ onSubmit, onCancel }: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    date: '',
    time: '',
    location: '',
    flyer: '',
    certificate: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSubmit({
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
        participants: 0,
        status: 'upcoming'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600" />
            Judul Kegiatan/Event
          </Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Masukkan judul event"
            required
            className="border-teal-200 focus:border-teal-500"
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" />
              Tanggal Event
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="border-teal-200 focus:border-teal-500"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" />
              Waktu/Jam
            </Label>
            <Input
              id="time"
              name="time"
              type="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="border-teal-200 focus:border-teal-500"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-600" />
            Lokasi Event
          </Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Masukkan lokasi event"
            required
            className="border-teal-200 focus:border-teal-500"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="flyer" className="flex items-center gap-2">
            <Image className="h-4 w-4 text-teal-600" />
            URL Flyer Event
          </Label>
          <Input
            id="flyer"
            name="flyer"
            type="url"
            value={formData.flyer}
            onChange={handleChange}
            placeholder="https://example.com/flyer.jpg"
            className="border-teal-200 focus:border-teal-500"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="certificate" className="flex items-center gap-2">
            <Award className="h-4 w-4 text-teal-600" />
            URL Template Sertifikat
          </Label>
          <Input
            id="certificate"
            name="certificate"
            type="url"
            value={formData.certificate}
            onChange={handleChange}
            placeholder="https://example.com/certificate.jpg"
            className="border-teal-200 focus:border-teal-500"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600" />
            Deskripsi Event
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Deskripsikan event Anda secara detail..."
            rows={4}
            className="border-teal-200 focus:border-teal-500"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            type="submit" 
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Membuat Event...' : 'Buat Event'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="flex-1 border-teal-300 text-teal-700 hover:bg-teal-50"
            disabled={isSubmitting}
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
