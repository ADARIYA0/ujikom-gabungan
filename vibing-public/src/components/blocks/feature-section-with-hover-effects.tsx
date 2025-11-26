import { cn } from "@/lib/utils";
import {
  Settings,
  Cloud,
  DollarSign,
  Zap,
  Heart,
  HelpCircle,
  Route,
  Terminal,
} from "lucide-react";

export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "Dibuat untuk Event Organizer",
      description:
        "Dirancang khusus untuk event organizer, planner, dan profesional event management yang mengutamakan efisiensi.",
      icon: <Terminal className="h-6 w-6" />,
    },
    {
      title: "Mudah Digunakan",
      description:
        "Interface yang intuitif dan user-friendly, membuat manajemen event menjadi lebih sederhana dan cepat.",
      icon: <Zap className="h-6 w-6" />,
    },
    {
      title: "Harga Terjangkau",
      description:
        "Paket harga yang kompetitif dengan fitur lengkap. Tidak ada biaya tersembunyi, transparan dan jelas.",
      icon: <DollarSign className="h-6 w-6" />,
    },
    {
      title: "Uptime 99.9%",
      description: "Platform yang stabil dan dapat diandalkan, siap melayani kapan saja Anda butuhkan.",
      icon: <Cloud className="h-6 w-6" />,
    },
    {
      title: "Multi-Event Management",
      description: "Kelola berbagai event sekaligus dalam satu dashboard yang terintegrasi dan efisien.",
      icon: <Route className="h-6 w-6" />,
    },
    {
      title: "Dukungan 24/7",
      description:
        "Tim support siap membantu Anda kapan saja. Dapatkan bantuan cepat untuk semua kebutuhan event Anda.",
      icon: <HelpCircle className="h-6 w-6" />,
    },
    {
      title: "Garansi Kepuasan",
      description:
        "Kami berkomitmen memberikan pengalaman terbaik. Jika tidak puas, kami akan membantu menyelesaikan masalah Anda.",
      icon: <Settings className="h-6 w-6" />,
    },
    {
      title: "Dan Banyak Lagi",
      description: "Fitur lengkap untuk semua kebutuhan manajemen event Anda dalam satu platform terintegrasi.",
      icon: <Heart className="h-6 w-6" />,
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800",
        (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
        index < 4 && "lg:border-b dark:border-neutral-800"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-primary transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};

