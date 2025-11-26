import { Button } from "@/components/ui/button";

interface ImageAsset {
  src: string;
  alt: string;
}

interface BreakoutAsset extends ImageAsset {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
}

interface CompanyLogo {
  src: string;
  alt: string;
}

interface Achievement {
  label: string;
  value: string;
}

interface About3Props {
  title?: string;
  description?: string;
  mainImage?: ImageAsset;
  secondaryImage?: ImageAsset;
  breakout?: BreakoutAsset;
  companiesTitle?: string;
  companies?: CompanyLogo[];
  achievementsTitle?: string;
  achievementsDescription?: string;
  achievements?: Achievement[];
}

const defaultCompanies: CompanyLogo[] = [
  {
    src: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=400&q=80",
    alt: "Dynamic planning",
  },
  {
    src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80",
    alt: "Live registration",
  },
  {
    src: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=400&q=80",
    alt: "Team collaboration",
  },
  {
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=400&q=80",
    alt: "Creative production",
  },
  {
    src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80",
    alt: "Partner network",
  },
  {
    src: "https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=400&q=80",
    alt: "Operations control",
  },
];

const defaultAchievements: Achievement[] = [
  { label: "Events Managed", value: "1,200+" },
  { label: "Active Organizers", value: "450+" },
  { label: "Happy Attendees", value: "95%" },
  { label: "Insights Delivered", value: "30k+" },
];

export const About3 = ({
  title = "VIBING, the event management suite",
  description =
    "VIBING is the platform for end-to-end event management—plan the experience, onboard attendees, and measure impact without juggling spreadsheets.",
  mainImage = {
    src: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80",
    alt: "Command center",
  },
  secondaryImage = {
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    alt: "Team collaboration",
  },
  breakout = {
    src: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=700&q=80",
    alt: "Productivity burst",
    title: "Insights woven into every launch",
    description:
      "Dashboards track every detail—from sponsorships to live check-ins—so your team can act before the issue even registers.",
    buttonText: "Plan with VIBING",
    buttonUrl: "https://vibing.my.id",
  },
  companiesTitle = "Trusted by ambitious teams",
  companies = defaultCompanies,
  achievementsTitle = "Performance in numbers",
  achievementsDescription =
    "Our orchestration layer keeps event teams aligned with real-time analytics, auto-generated tasks, and transparent workflows.",
  achievements = defaultAchievements,
}: About3Props = {}) => {
  return (
    <section className="py-24">
      <div className="container mx-auto">
        <div className="mb-12 grid gap-6 text-center md:grid-cols-2 md:text-left">
          <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h1>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
            {description}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <img
            src={mainImage.src}
            alt={mainImage.alt}
            className="max-h-[620px] w-full rounded-2xl object-cover shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 lg:col-span-2"
          />
          <div className="flex flex-col gap-7">
            <div className="flex flex-col justify-between gap-5 rounded-2xl bg-slate-100/90 p-8 shadow-xl dark:bg-slate-900/60">
              <img
                src={breakout.src}
                alt={breakout.alt}
                className="h-12 w-auto"
              />
              <div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {breakout.title}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {breakout.description}
                </p>
              </div>
              <Button variant="outline" className="self-start" asChild>
                <a href={breakout.buttonUrl} target="_blank" rel="noreferrer">
                  {breakout.buttonText}
                </a>
              </Button>
            </div>
            <img
              src={secondaryImage.src}
              alt={secondaryImage.alt}
              className="h-full w-full flex-1 rounded-2xl object-cover shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10"
            />
          </div>
        </div>

        <div className="py-20">
          <p className="text-center text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
            {companiesTitle}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-10">
            {companies.map((company, idx) => (
              <div
                key={`${company.src}-${idx}`}
                className="flex items-center gap-3"
              >
                <img
                  src={company.src}
                  alt={company.alt}
                  className="h-6 w-auto object-contain opacity-90"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-slate-900/95 p-10 text-white shadow-2xl">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-3xl font-semibold">{achievementsTitle}</h2>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-200 md:mx-0">
              {achievementsDescription}
            </p>
          </div>
          <div className="mt-10 flex flex-wrap justify-between gap-8 text-center">
            {achievements.map((item, idx) => (
              <div className="flex flex-col gap-2" key={`${item.label}-${idx}`}>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                  {item.label}
                </p>
                <span className="text-4xl font-semibold md:text-5xl">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

