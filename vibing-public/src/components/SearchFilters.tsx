'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Filters, EventCategory } from '@/types';

interface SearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
  availableCategories?: EventCategory[]; // Categories dari response event
}

export function SearchFilters({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearFilters,
  availableCategories = []
}: SearchFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debouncedSearchQuery = useDebounce(localSearchQuery, 500);

  // Effect untuk sync dengan external searchQuery
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Effect untuk trigger search ketika debounced value berubah
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      onSearchChange(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, onSearchChange, searchQuery]);

  const dateRanges = [
    { value: 'all', label: 'Semua Waktu' },
    { value: 'today', label: 'Hari Ini' },
    { value: 'this_week', label: 'Minggu Ini' },
    { value: 'this_month', label: 'Bulan Ini' },
    { value: 'next_month', label: 'Bulan Depan' }
  ];

  const handleFilterChange = (key: keyof Filters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value && value !== 'all' && value !== 'Semua Kategori' && value !== 'Semua Waktu'
    ).length;
  };

  const getActiveFilters = () => {
    const active = [];
    if (filters.category && filters.category !== 'all' && filters.category !== 'Semua Kategori') {
      const categoryName = availableCategories.find((cat: EventCategory) => cat.slug === filters.category)?.nama_kategori || filters.category;
      active.push({ key: 'category', label: categoryName });
    }
    if (filters.dateRange && filters.dateRange !== 'all' && filters.dateRange !== 'Semua Waktu') {
      const dateRangeName = dateRanges.find(range => range.value === filters.dateRange)?.label || filters.dateRange;
      active.push({ key: 'dateRange', label: dateRangeName });
    }
    return active;
  };

  const removeFilter = (key: string) => {
    const defaultValues = {
      category: 'all',
      dateRange: 'all'
    };
    handleFilterChange(key as keyof Filters, defaultValues[key as keyof typeof defaultValues]);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-teal-500/30 to-primary/30 rounded-lg blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-hover:text-primary group-focus-within:text-primary transition-colors duration-300" />
          <Input
            placeholder="Cari event berdasarkan nama..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 rounded-lg border-2 border-gray-700/50 focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-300 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white placeholder:text-gray-500 hover:border-primary/50 hover:bg-gray-900/80 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Mobile Filter Button - Only show on mobile/tablet */}
        <div className="md:hidden">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative border-gray-700/50 text-gray-300 hover:bg-gradient-to-r hover:from-gray-800 hover:to-gray-700 hover:border-primary/50 bg-gradient-to-br from-gray-900 to-gray-800 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {getActiveFiltersCount() > 0 && (
                  <Badge className="ml-2 bg-gradient-to-r from-primary to-teal-500 text-white text-xs shadow-lg shadow-primary/30">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Filter Event</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="text-primary hover:text-teal-700"
                >
                  Reset
                </Button>
              </div>
              
              <Separator className="bg-gray-200" />

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center text-gray-700">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    Kategori
                  </label>
                  <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {availableCategories.map((category: EventCategory) => (
                        <SelectItem key={category.id} value={category.slug}>
                          {category.nama_kategori}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 flex items-center text-gray-700">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    Waktu
                  </label>
                  <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Waktu" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateRanges.map((range) => (
                        <SelectItem key={range.value || 'all'} value={range.value || 'all'}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        </div>

        {/* Quick Filters */}
        <div className="hidden md:flex items-center gap-3">
          <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger className="w-44 h-10 border-gray-700/50 text-sm bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300 hover:border-primary/50 hover:bg-gray-900/80 transition-all duration-300">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {availableCategories.map((category: EventCategory) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.nama_kategori}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
            <SelectTrigger className="w-36 h-10 border-gray-700/50 text-sm bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300 hover:border-primary/50 hover:bg-gray-900/80 transition-all duration-300">
              <SelectValue placeholder="Semua Waktu" />
            </SelectTrigger>
            <SelectContent>
              {dateRanges.map((range) => (
                <SelectItem key={range.value || 'all'} value={range.value || 'all'}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {getActiveFiltersCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-primary hover:text-teal-700"
          >
            Hapus Filter
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {getActiveFilters().length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-400">Filter aktif:</span>
          {getActiveFilters().map((filter, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 bg-gradient-to-r from-teal-900/80 to-primary/80 text-teal-100 border-teal-600/50 text-xs shadow-md shadow-teal-500/20 hover:shadow-teal-500/30 transition-all duration-300"
            >
              {filter.label}
              <button
                onClick={() => removeFilter(filter.key)}
                className="ml-1 hover:bg-white/10 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
