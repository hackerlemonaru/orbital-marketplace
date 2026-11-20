import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** One scrubbed object-to-collection moment, disabled for reduced motion. */
export function startShowcase(section: HTMLElement) {
  const cards = [...section.querySelectorAll<HTMLElement>('.card-image img')];
  if (!cards.length) return () => {};
  const ctx = gsap.context(() => {
    const timeline = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top top', end: '+=360', scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
      defaults: { ease: 'power3.out' },
    });
    timeline.fromTo(cards, { scale: .9, y: 22 }, { scale: 1, y: 0, duration: 1, stagger: .08 }, 0);
  }, section);
  return () => ctx.revert();
}
