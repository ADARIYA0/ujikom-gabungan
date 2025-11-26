'use client';

import React from 'react';
import Image from 'next/image';
import { useCategoriesForHero } from '@/hooks/useCategories';

interface HeroProps {
  backgroundImage?: string;
}

export function Hero({
  backgroundImage = "/hero-background.jpg"
}: HeroProps = {}) {
  // Fetch categories from backend API
  const { categories, isLoading, error } = useCategoriesForHero();


  // Create event images array from categories data
  const eventImages = React.useMemo(() => {
    if (isLoading || error || categories.length === 0) {
      // Fallback images while loading or on error
      return [
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGY0NjRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
      ];
    }

    // Use real category images from backend
    return categories.map(category => category.kategori_logo_url || '').filter(Boolean);
  }, [categories, isLoading, error]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-black hero-container">
      
      {/* Event Images Cards - Responsive and Centered */}
      <div className="absolute inset-0 flex items-center justify-center -translate-y-2 sm:-translate-y-4 md:-translate-y-6 lg:-translate-y-8 xl:-translate-y-12">
        {/* Error indicator */}
        {error && !isLoading && (
          <div className="text-red-400 text-sm sm:text-base md:text-lg">Gagal memuat kategori</div>
        )}
        
        {/* Event Images Cards - Responsive Grid Layout */}
        {!isLoading && !error && categories.length > 0 && (
          <div className="w-full mx-auto">
            {/* Mobile: 2 cards per row */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 transform -rotate-2 scale-90 sm:hidden">
              {categories.slice(0, Math.min(4, categories.length)).map((category, index) => (
                <div
                  key={`category-card-mobile-${category.id}`}
                  className="group relative w-full aspect-[3/4] bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden rounded-md shadow-lg card-hover-transition cursor-pointer"
                >
                  {category.kategori_logo_url ? (
                    <Image
                      src={category.kategori_logo_url}
                      alt={`${category.nama_kategori} Category`}
                      fill
                      className="object-cover transition-all duration-300 group-hover:brightness-50"
                      quality={85}
                      priority={index < 4}
                      loading={index < 4 ? 'eager' : 'lazy'}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.fallback-content');
                          if (fallback) {
                            (fallback as HTMLElement).style.display = 'flex';
                          }
                        }
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback content */}
                  <div className="fallback-content absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800 text-white transition-all duration-300 group-hover:brightness-50" style={{ display: category.kategori_logo_url ? 'none' : 'flex' }}>
                    <div className="text-center p-1">
                      <div className="text-lg font-bold mb-0.5">
                        {category.nama_kategori.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs font-medium leading-tight">
                        {category.nama_kategori}
                      </div>
                    </div>
                  </div>

                  {/* Dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-center transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-white text-xs font-bold uppercase tracking-wide">
                        {category.nama_kategori}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Small tablets: 3 cards per row */}
            <div className="hidden sm:grid sm:grid-cols-3 md:hidden gap-2 transform -rotate-2 scale-95">
              {categories.slice(0, Math.min(6, categories.length)).map((category, index) => (
                <div
                  key={`category-card-sm-${category.id}`}
                  className="group relative w-full aspect-[3/4] bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden rounded-lg shadow-lg card-hover-transition cursor-pointer"
                >
                  {category.kategori_logo_url ? (
                    <Image
                      src={category.kategori_logo_url}
                      alt={`${category.nama_kategori} Category`}
                      fill
                      className="object-cover transition-all duration-300 group-hover:brightness-50"
                      quality={85}
                      priority={index < 6}
                      loading={index < 6 ? 'eager' : 'lazy'}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.fallback-content');
                          if (fallback) {
                            (fallback as HTMLElement).style.display = 'flex';
                          }
                        }
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback content */}
                  <div className="fallback-content absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800 text-white transition-all duration-300 group-hover:brightness-50" style={{ display: category.kategori_logo_url ? 'none' : 'flex' }}>
                    <div className="text-center p-2">
                      <div className="text-lg font-bold mb-1">
                        {category.nama_kategori.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm font-medium leading-tight">
                        {category.nama_kategori}
                      </div>
                    </div>
                  </div>

                  {/* Dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-center transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-white text-sm font-bold uppercase tracking-wide">
                        {category.nama_kategori}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Medium and larger screens: Horizontal flex layout */}
            <div className="hidden md:flex justify-center items-center transform -rotate-3 hero-cards-container" style={{ gap: `calc(0.5rem + 1vw)` }}>
              {categories.slice(0, Math.min(10, categories.length)).map((category, index) => (
                <div
                  key={`category-card-${category.id}`}
                  className="group relative flex-shrink-0 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden rounded-lg shadow-xl card-hover-transition cursor-pointer"
                  style={{
                    width: `calc(4rem + 12vw)`,
                    height: `calc(6rem + 15vw)`
                  }}
                >
                  {category.kategori_logo_url ? (
                    <Image
                      src={category.kategori_logo_url}
                      alt={`${category.nama_kategori} Category`}
                      fill
                      className="object-cover transition-all duration-300 group-hover:brightness-50"
                      quality={85}
                      priority={index < 6}
                      loading={index < 6 ? 'eager' : 'lazy'}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.fallback-content');
                          if (fallback) {
                            (fallback as HTMLElement).style.display = 'flex';
                          }
                        }
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback content when image fails or doesn't exist */}
                  <div className="fallback-content absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800 text-white transition-all duration-300 group-hover:brightness-50" style={{ display: category.kategori_logo_url ? 'none' : 'flex' }}>
                    <div className="text-center p-2">
                      <div className="text-lg md:text-xl font-bold mb-1">
                        {category.nama_kategori.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs md:text-sm font-medium leading-tight">
                        {category.nama_kategori}
                      </div>
                    </div>
                  </div>

                  {/* Dark overlay on hover with category text */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-white text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold uppercase tracking-wide">
                        {category.nama_kategori}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading state - Responsive */}
        {isLoading && (
          <div className="w-full mx-auto">
            {/* Mobile loading */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 transform -rotate-2 scale-90 sm:hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`loading-card-mobile-${index}`}
                  className="relative w-full aspect-[3/4] bg-gray-700 animate-pulse rounded-md"
                />
              ))}
            </div>

            {/* Small tablet loading */}
            <div className="hidden sm:grid sm:grid-cols-3 md:hidden gap-2 transform -rotate-2 scale-95">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`loading-card-sm-${index}`}
                  className="relative w-full aspect-[3/4] bg-gray-700 animate-pulse rounded-lg"
                />
              ))}
            </div>

            {/* Medium and larger loading */}
            <div className="hidden md:flex justify-center items-center transform -rotate-3 hero-cards-container" style={{ gap: `calc(0.5rem + 1vw)` }}>
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={`loading-card-${index}`}
                  className="relative flex-shrink-0 bg-gray-700 animate-pulse rounded-lg"
                  style={{
                    width: `calc(4rem + 12vw)`,
                    height: `calc(6rem + 15vw)`
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Animated Text Below Cards - Responsive Typography */}
      <div className="absolute bottom-8 sm:bottom-12 md:bottom-16 lg:bottom-20 xl:bottom-24 left-0 right-0 z-10 overflow-hidden">
        <div className="relative">
          {/* Infinite scrolling text animation */}
          <div className="flex animate-marquee whitespace-nowrap">
            {/* First set of categories */}
            <div className="flex items-center space-x-4 sm:space-x-6 md:space-x-8 text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-black text-white tracking-wider uppercase">
              {!isLoading && !error && categories.length > 0 ? (
                categories.map((category, index) => (
                  <React.Fragment key={`first-${category.id}`}>
                    <span>{category.nama_kategori}</span>
                    {index < categories.length - 1 && <span className="text-slate-600">•</span>}
                  </React.Fragment>
                ))
              ) : (
                <>
                  <span>WORKSHOP</span>
                  <span className="text-slate-600">•</span>
                  <span>SEMINAR</span>
                  <span className="text-slate-600">•</span>
                  <span>PELATIHAN</span>
                  <span className="text-slate-600">•</span>
                  <span>WEBINAR</span>
                </>
              )}
            </div>
            
            {/* Second set for seamless loop */}
            <div className="flex items-center space-x-4 sm:space-x-6 md:space-x-8 text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-black text-white tracking-wider uppercase ml-4 sm:ml-6 md:ml-8">
              {!isLoading && !error && categories.length > 0 ? (
                categories.map((category, index) => (
                  <React.Fragment key={`second-${category.id}`}>
                    <span>{category.nama_kategori}</span>
                    {index < categories.length - 1 && <span className="text-slate-600">•</span>}
                  </React.Fragment>
                ))
              ) : (
                <>
                  <span>WORKSHOP</span>
                  <span className="text-slate-600">•</span>
                  <span>SEMINAR</span>
                  <span className="text-slate-600">•</span>
                  <span>PELATIHAN</span>
                  <span className="text-slate-600">•</span>
                  <span>WEBINAR</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
