import { About3 } from "@/components/ui/about-3";

export const About3Demo = () => {
  return (
    <About3
      title="VIBING: Event management tanpa batas"
      description="Platform kami menjaga detail perencanaan, sponsor, dan absensi tetap sinkron sehingga tim Anda bisa fokus menyampaikan pengalaman terbaik."
      mainImage={{
        src: "https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&w=1400&q=80",
        alt: "Studio event planning",
      }}
      secondaryImage={{
        src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
        alt: "Team alignment board",
      }}
      breakout={{
        src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
        alt: "Live analytics",
        title: "Insight real-time",
        description:
          "Lihat status tiket, keuangan, dan integrasi partner dalam satu layar tanpa menunggu laporan manual.",
        buttonText: "Kenalan dengan VIBING",
        buttonUrl: "https://vibing.my.id",
      }}
      companiesTitle="Trusted by Indonesian event makers"
      achievementsTitle="VIBING in action"
      achievementsDescription="Tim event terus mempercepat delivery dengan automation, notifikasi, dan kolaborasi lintas departemen."
      achievements={[
        { label: "Events automated", value: "1.200+" },
        { label: "Registrations processed", value: "250.000+" },
        { label: "Positive reviews", value: "98%" },
        { label: "Platform updates", value: "35+" },
      ]}
    />
  );
};

