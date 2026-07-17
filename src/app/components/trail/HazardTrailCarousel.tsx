import { useEffect, useState } from 'react';
import { cn } from '../ui/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '../ui/carousel';
import { HazardNotice } from './HazardNotice';
import { HAZARD_COLORS } from '../../lib/hazards';

export type HazardTrailSlide = {
  id: string;
  trailName: string;
  conditions: string[];
};

interface HazardTrailCarouselProps {
  slides: HazardTrailSlide[];
  className?: string;
}

/** One or more trail hazard callouts; swipe carousel when there are several. */
export function HazardTrailCarousel({ slides, className }: HazardTrailCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    onSelect();
    api.on('select', onSelect);
    api.on('reInit', onSelect);
    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api]);

  if (slides.length === 0) return null;

  if (slides.length === 1) {
    return (
      <div className={cn(className)}>
        <HazardNotice
          conditions={slides[0].conditions}
          trailName={slides[0].trailName}
        />
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      <Carousel
        setApi={setApi}
        opts={{ align: 'start', loop: false, dragFree: false }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="pl-2 basis-[90%]">
              <HazardNotice
                conditions={slide.conditions}
                trailName={slide.trailName}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="flex items-center justify-center gap-1.5 mt-2.5" role="tablist">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`${slide.trailName} (${i + 1}/${slides.length})`}
            onClick={() => api?.scrollTo(i)}
            className="size-2 rounded-full transition-colors"
            style={{
              backgroundColor:
                i === index ? HAZARD_COLORS.ink : HAZARD_COLORS.cardBorder,
            }}
          />
        ))}
      </div>
    </div>
  );
}
