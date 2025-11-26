"use client";

import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { fetchEvents } from '@/services/eventService';
import { Download, Users, Calendar } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_KEY;

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsvRow(values: (string|number|null|undefined)[]) {
  return values
    .map(v => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    })
    .join(',');
}

export default function ExportsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  // removed preview table states; only selection table used

  useEffect(() => {
    (async () => {
      try {
        const evs = await fetchEvents({ limit: 1000 });
        setEvents(evs);
      } catch (err) {
        console.error('Failed to load events', err);
      }
    })();
  }, []);

  const toggle = (id: number) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // helper: refresh events list
  const refreshEvents = async () => {
    try {
      setLoading(true);
      const evs = await fetchEvents({ limit: 1000 });
      setEvents(evs);
    } catch (err) {
      console.error('Failed to refresh events', err);
      alert('Gagal memuat daftar kegiatan. Cek console untuk detail.');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    try {
      setLoading(true);
      const selectedIds = Object.keys(selected).filter(k => selected[Number(k)]).map(k => Number(k));
      const params = new URLSearchParams();
      params.append('year', String(year));
      if (selectedIds.length) params.append('eventIds', selectedIds.join(','));

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const res = await fetch(`${API_BASE}/events/export/attendance?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();

      // Build CSV
      const lines: string[] = [];
      lines.push(toCsvRow(['Year', data.year]));
      lines.push(toCsvRow(['Total Events', data.total_events]));
      lines.push(toCsvRow(['Total Checked-in (sum)', data.total_checked_in]));
      lines.push(toCsvRow(['Unique Checked-in Users', data.unique_checked_in_users]));
      lines.push('');
      lines.push(toCsvRow(['Event ID', 'Title', 'Start', 'End', 'Capacity', 'Registered Count', 'Checked-in Count']));

      for (const ev of data.events) {
        lines.push(toCsvRow([
          ev.id,
          ev.judul_kegiatan,
          ev.waktu_mulai,
          ev.waktu_berakhir,
          ev.kapasitas_peserta,
          ev.attendee_count,
          ev.checked_in_count
        ]));
      }

      const csv = lines.join('\n');
      const filename = `event-export-${year}.csv`;
      downloadCsv(filename, csv);
    } catch (err) {
      console.error('Export failed', err);
      alert('Gagal mengekspor data. Cek console untuk detail.');
    } finally {
      setLoading(false);
    }
  };

  const exportXlsx = async () => {
    try {
      setLoading(true);
      const selectedIds = Object.keys(selected).filter(k => selected[Number(k)]).map(k => Number(k));
      const params = new URLSearchParams();
      params.append('year', String(year));
      if (selectedIds.length) params.append('eventIds', selectedIds.join(','));

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(`${API_BASE}/events/export/attendance?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      // Build worksheet as array of arrays
      const ws_data: any[] = [];
      ws_data.push(['Year', data.year]);
      ws_data.push(['Total Events', data.total_events]);
      ws_data.push(['Total Checked-in (sum)', data.total_checked_in]);
      ws_data.push(['Unique Checked-in Users', data.unique_checked_in_users]);
      ws_data.push([]);
      ws_data.push(['Event ID', 'Title', 'Start', 'End', 'Capacity', 'Registered Count', 'Checked-in Count']);

      for (const ev of data.events) {
        ws_data.push([
          ev.id,
          ev.judul_kegiatan,
          ev.waktu_mulai,
          ev.waktu_berakhir,
          ev.kapasitas_peserta,
          ev.attendee_count,
          ev.checked_in_count
        ]);
      }

      // Dynamic import of xlsx (SheetJS)
      const mod = await import('xlsx');
      const XLSX = (mod && (mod.default || mod)) as any;
      if (!XLSX || !XLSX.utils) throw new Error('xlsx module did not load correctly');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      XLSX.utils.book_append_sheet(wb, ws, 'Export');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-export-${year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('XLSX export failed', err);
      const msg = err?.message || String(err);
      alert(`Gagal mengekspor XLSX: ${msg}\nPeriksa console untuk detail.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ekspor Data Kegiatan</h1>
          <p className="text-gray-600 mt-1">Kelola dan ekspor data kehadiran peserta event</p>
        </div>

        {/* Filter & Export Controls */}
        <Card className="border-l-4 border-l-teal-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-600" />
              Filter & Ekspor
            </CardTitle>
            <CardDescription>Pilih tahun dan format ekspor data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tahun</label>
                <select 
                  value={year} 
                  onChange={(e) => setYear(Number(e.target.value))} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {Array.from({ length: 6 }).map((_, i) => {
                    const y = new Date().getFullYear() - i;
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <select 
                  value={format} 
                  onChange={(e) => setFormat(e.target.value as 'csv' | 'xlsx')} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="csv">CSV</option>
                  <option value="xlsx">XLSX</option>
                </select>
              </div>

              <div className="md:col-span-2 flex items-end gap-3">
                <Button
                  onClick={refreshEvents}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Refresh List
                </Button>
                <Button
                  onClick={() => (format === 'csv' ? exportCsv() : exportXlsx())}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Ekspor {format === 'csv' ? 'CSV' : 'XLSX'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Selection Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              Pilih Kegiatan untuk Ekspor
            </CardTitle>
            <CardDescription>Kosongkan semua untuk mengekspor semua kegiatan pada tahun yang dipilih</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left">
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newSelected: Record<number, boolean> = {};
                            events.forEach(ev => {
                              newSelected[Number(ev.id)] = true;
                            });
                            setSelected(newSelected);
                          } else {
                            setSelected({});
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Nama Kegiatan</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Tanggal</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Peserta</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Hadir</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Memuat data kegiatan...
                      </td>
                    </tr>
                  ) : (
                    events.map((ev, idx) => (
                      <tr 
                        key={ev.id} 
                        className={`border-b border-gray-200 hover:bg-teal-50/50 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            checked={!!selected[Number(ev.id)]} 
                            onChange={() => toggle(Number(ev.id))}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{ev.title || ev.judul_kegiatan}</div>
                          <div className="text-xs text-gray-500 mt-0.5">ID: {ev.id}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {ev.date ? new Date(ev.date).toLocaleDateString('id-ID') : ev.waktu_mulai ? new Date(ev.waktu_mulai).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                            {ev.attendee_count || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                            {ev.checked_in_count || 0}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              {Object.values(selected).filter(Boolean).length > 0 ? (
                <p>✓ {Object.values(selected).filter(Boolean).length} kegiatan dipilih</p>
              ) : (
                <p>Tidak ada kegiatan yang dipilih (semua akan diekspor)</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview removed - selection table is primary */}
      </div>
    </AdminLayout>
  );
}
