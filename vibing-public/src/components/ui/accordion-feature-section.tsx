"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface FeatureItem {
  id: number;
  title: string;
  image: string;
  description: string;
}

interface Feature197Props {
  features?: FeatureItem[];
  className?: string;
}

const defaultFeatures: FeatureItem[] = [
  {
    id: 1,
    title: "Bagaimana cara peserta melakukan check-in digital?",
    image:
      "https://images.unsplash.com/photo-1485217988980-11786ced9454?w=900&h=600&auto=format&fit=crop",
    description:
      "Peserta cukup membuka email token, lalu tunjukkan QR atau kode unik saat tiba di venue. Tim kami menyiapkan dashboard check-in real-time sehingga antrean lebih singkat dan data kehadiran langsung tercatat.",
  },
  {
    id: 2,
    title: "Bisakah saya menjual tiket berbayar dan gratis secara bersamaan?",
    image:
      "https://images.unsplash.com/photo-1485988412941-77a35537dae4?w=900&h=600&auto=format&fit=crop",
    description:
      "Tentu. Anda dapat membuat beberapa tier tiket, menetapkan kuota berbeda, dan memantau performa penjualan di satu panel analitik. Semua pembayaran terintegrasi e-wallet dan transfer bank lokal.",
  },
  {
    id: 3,
    title: "Apa strategi terbaik untuk mempromosikan event digital?",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900&h=600&auto=format&fit=crop",
    description:
      "Gunakan halaman event yang sudah SEO-ready, bagikan tautan affiliate untuk speaker atau sponsor, dan aktifkan notifikasi email berjadwal. Anda juga bisa memanfaatkan landing page kustom dengan CTA yang dapat diubah sewaktu-waktu.",
  },
  {
    id: 4,
    title: "Bagaimana memastikan sponsor mendapatkan visibilitas maksimal?",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&h=600&auto=format&fit=crop",
    description:
      "Sisipkan logo sponsor di halaman registrasi, tiket digital, hingga layar check-in. Platform kami menyediakan laporan impresi dan interaksi sehingga sponsor mengetahui dampak kampanye mereka di setiap event.",
  },
  {
    id: 5,
    title: "Apakah data peserta aman?",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&h=600&auto=format&fit=crop",
    description:
      "Seluruh data terenkripsi, tersimpan di wilayah server Indonesia, dan sesuai standar GDPR. Anda dapat mengatur peran panitia agar hanya tim tertentu yang dapat melihat informasi sensitif peserta ataupun transaksi.",
  },
];

export function Feature197({ features = defaultFeatures, className }: Feature197Props) {
  const preparedFeatures = useMemo(
    () => (features.length ? features : defaultFeatures),
    [features],
  );
  const firstFeature = preparedFeatures[0];

  const [activeTabId, setActiveTabId] = useState<number | null>(firstFeature?.id ?? null);
  const [activeImage, setActiveImage] = useState<string>(firstFeature?.image ?? "");

  return (
    <section className={cn("py-20 sm:py-24", className)}>
      <div className="container mx-auto px-4">
        <div className="grid w-full gap-12 md:grid-cols-2 md:items-start">
          <div className="w-full">
            <Accordion type="single" className="w-full" defaultValue={`item-${firstFeature?.id ?? 1}`}>
              {preparedFeatures.map((tab) => (
                <AccordionItem key={tab.id} value={`item-${tab.id}`} className="relative overflow-hidden rounded-2xl border border-transparent px-2">
                  <AnimatePresence>
                    {tab.id === activeTabId && (
                      <motion.span
                        layoutId="faq-highlight"
                        className="absolute inset-0 rounded-2xl bg-primary/5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </AnimatePresence>
                  <AccordionTrigger
                    onClick={() => {
                      setActiveImage(tab.image);
                      setActiveTabId(tab.id);
                    }}
                    className="relative cursor-pointer py-5 !no-underline transition focus:outline-none"
                  >
                    <h6
                      className={`text-left text-lg font-semibold md:text-xl ${
                        tab.id === activeTabId ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {tab.title}
                    </h6>
                  </AccordionTrigger>
                  <AccordionContent>
                    <motion.div
                      key={tab.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <p className="mt-3 text-base text-muted-foreground">{tab.description}</p>
                    </motion.div>
                    <div className="mt-4 md:hidden">
                      <div className="relative h-64 w-full overflow-hidden rounded-lg">
                        <Image
                          src={tab.image}
                          alt={tab.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                          priority={tab.id === firstFeature?.id}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div className="relative hidden w-full overflow-hidden rounded-2xl bg-muted md:block">
            <AnimatePresence mode="wait">
              {activeImage && (
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative aspect-[4/3] w-full"
                >
                  <Image
                    src={activeImage}
                    alt="Feature preview"
                    fill
                    sizes="(max-width: 1024px) 50vw, 600px"
                    className="object-cover"
                    priority
                  />
                  <motion.div
                    className="absolute inset-0 rounded-2xl border border-white/20 shadow-[0_0_45px_rgba(15,23,42,0.22)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

