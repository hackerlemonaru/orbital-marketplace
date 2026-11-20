import { useEffect } from 'react';

/**
 * One motion system: Lenis drives ScrollTrigger, GSAP owns the hero and pinned
 * sequence, and Motion owns React layout/drawer transitions. All GSAP work is
 * transform/opacity based; reduced motion disables the entire system.
 */
export function useOrbitalMotion(phase: number, reducedMotion: boolean): void {
  useEffect(() => {
    if (reducedMotion) return;
    let disposed = false;
    let gsapRef: any = null;
    let scrollTriggerRef: any = null;
    let lenis: any = null;
    let matchMedia: any = null;
    let split: any = null;
    let ticker: ((time: number) => void) | null = null;
    const triggers: any[] = [];

    const setup = async () => {
      const [gsapModule, scrollTriggerModule, splitTextModule, flipModule, lenisModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('gsap/SplitText'),
        import('gsap/Flip'),
        import('lenis'),
      ]);
      if (disposed) return;

      const gsap = gsapModule.gsap || gsapModule.default;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;
      const SplitText = splitTextModule.SplitText || splitTextModule.default;
      const Flip = flipModule.Flip || flipModule.default;
      const Lenis = lenisModule.default;
      gsapRef = gsap;
      scrollTriggerRef = ScrollTrigger;

      gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
      gsap.defaults({ ease: 'power3.out', duration: 0.4 });

      lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, touchMultiplier: 1 });
      lenis.on('scroll', ScrollTrigger.update);
      ticker = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);

      try { await document.fonts.ready; } catch { /* fonts are optional for animation */ }
      if (disposed) return;

      const headline = document.querySelector('.hero-headline');
      if (headline) {
        split = new SplitText(headline, { type: 'words', wordsClass: 'hero-word' });
        gsap.from(split.words, {
          yPercent: 34,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.035,
        });
      }

      if (phase >= 2) {
        const connector = document.querySelector('.provenance-line') as SVGPathElement | null;
        const drawConnector = () => {
          if (!connector) return;
          const length = connector.getTotalLength();
          gsap.set(connector, { strokeDasharray: length, strokeDashoffset: length });
          const trigger = ScrollTrigger.create({
            trigger: '.provenance',
            start: 'top 72%',
            once: true,
            onEnter: () => gsap.to(connector, { strokeDashoffset: 0, duration: 0.8, ease: 'power3.out' }),
          });
          triggers.push(trigger);
        };

        matchMedia = gsap.matchMedia();
        matchMedia.add('(min-width: 900px)', () => {
          const stage = document.querySelector('.sequence-stage');
          const object = document.querySelector('.sequence-object');
          const cards = gsap.utils.toArray('.sequence-card') as HTMLElement[];
          let isOpen = false;
          const flipCards = (open: boolean) => {
            if (!stage || !cards.length || isOpen === open) return;
            isOpen = open;
            const state = Flip.getState(cards);
            stage.classList.toggle('is-open', open);
            Flip.from(state, {
              duration: 0.8,
              ease: 'power3.out',
              absolute: true,
              stagger: 0.04,
              onComplete: () => ScrollTrigger.refresh(),
            });
          };

          const trigger = ScrollTrigger.create({
            trigger: '.sequence-pin',
            start: 'top top',
            end: '+=50%',
            pin: '.sequence-pin-inner',
            scrub: 0.6,
            anticipatePin: 1,
            onUpdate: (self: any) => {
              if (object) {
                gsap.set(object, {
                  rotationY: self.progress * 34,
                  y: -self.progress * 44,
                  opacity: 1 - self.progress * 0.5,
                });
              }
              if (self.progress > 0.42) flipCards(true);
            },
            onLeaveBack: () => flipCards(false),
          });
          triggers.push(trigger);
          drawConnector();
          return () => { flipCards(false); };
        });

        matchMedia.add('(max-width: 899px)', () => {
          // Mobile keeps the story static and skips the pinned sequence.
          document.querySelector('.sequence-stage')?.classList.add('is-open');
          drawConnector();
          return () => {};
        });
        ScrollTrigger.refresh();
      }
    };

    setup().catch((error) => console.warn('Motion system unavailable', error));

    return () => {
      disposed = true;
      try { split?.revert(); } catch { /* no split to revert */ }
      triggers.forEach((trigger) => { try { trigger.kill(); } catch { /* already gone */ } });
      try { matchMedia?.revert(); } catch { /* no matchMedia */ }
      if (lenis && scrollTriggerRef) {
        try { lenis.off('scroll', scrollTriggerRef.update); } catch { /* no listener */ }
        try { lenis.destroy(); } catch { /* already destroyed */ }
      }
      if (gsapRef && ticker) {
        try { gsapRef.ticker.remove(ticker); } catch { /* no ticker */ }
        try { gsapRef.ticker.lagSmoothing(500, 33); } catch { /* no ticker */ }
      }
      if (scrollTriggerRef) {
        try { scrollTriggerRef.refresh(); } catch { /* page is unloading */ }
      }
    };
  }, [phase, reducedMotion]);
}
