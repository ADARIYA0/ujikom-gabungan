import Image from "next/image";

interface FeatureProps {
  heading?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
}

function Feature({
  heading = "This is the start of something new",
  description = "Managing a small business today is already tough. Avoid further complications by ditching outdated, tedious trade methods. Our goal is to streamline SMB trade, making it easier and faster than ever.",
  imageSrc = "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=800&fit=crop",
  imageAlt = "Feature image",
}: FeatureProps) {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="flex flex-col-reverse lg:flex-row gap-10 lg:items-center">
          <div className="relative w-full aspect-video h-full flex-1 rounded-md overflow-hidden bg-muted">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex gap-4 pl-0 lg:pl-20 flex-col flex-1">
            <div className="flex gap-2 flex-col">
              <h2 className="text-xl md:text-3xl lg:text-5xl tracking-tighter lg:max-w-xl font-regular text-left">
                {heading}
              </h2>
              <p className="text-lg max-w-xl lg:max-w-sm leading-relaxed tracking-tight text-muted-foreground text-left">
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature };

