import { Calendar, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white">
      {/* Orange Strip */}
      <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
      
      {/* Main Footer Content */}
      <div className="py-8">
        <div className="container mx-auto px-4">
          {/* Logo and Brand */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">PlanHub</span>
            </div>
            <p className="text-slate-400 max-w-md mx-auto">
              Platform event terpercaya untuk menghubungkan Anda dengan ribuan event berkualitas.
            </p>
          </div>

          {/* Social Media */}
          <div className="flex items-center justify-center space-x-6 mb-6">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6 text-sm">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Apa itu PlanHub?</a>
            <span className="text-slate-600">•</span>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Syarat dan Ketentuan</a>
            <span className="text-slate-600">•</span>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Kebijakan Privasi</a>
          </div>

          {/* Copyright */}
          <div className="text-center text-slate-500 text-sm">
            © {currentYear} PT Vibing Global Media. All Rights Reserved
          </div>
        </div>
      </div>
    </footer>
  );
}
