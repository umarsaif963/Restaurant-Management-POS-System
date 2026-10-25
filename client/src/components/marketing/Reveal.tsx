import { useEffect, useRef, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Stagger in ms, applied via --reveal-delay (see index.css). */
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}

/**
 * Scroll-reveal wrapper. The wrapper itself carries [data-reveal] and flips to
 * its visible state once it enters the viewport (see index.css), so each
 * <Reveal> is one animated unit - stagger by passing increasing `delay` to
 * sibling wrappers. Under prefers-reduced-motion or when JS never runs,
 * content stays fully visible.
 */
export function Reveal({ children, delay = 0, className = '', as = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // The wrapper plus any nested [data-reveal] elements (e.g. <RevealItem>).
    const targets: HTMLElement[] = [node];
    node.querySelectorAll<HTMLElement>('[data-reveal]').forEach((child) => targets.push(child));

    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((target) => target.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Reveal when visible, but also once the element has been jumped
          // past (its top is above the viewport): instant scroll jumps can move
          // an element from below to above the fold without ever producing an
          // intersecting frame, and it would then stay hidden forever.
          const jumpedPast = entry.boundingClientRect.top < window.innerHeight;
          if (entry.isIntersecting || jumpedPast) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      // Reveal as soon as the element crosses ~90% of the viewport height;
      // per-child staggering comes from --reveal-delay, not from thresholds.
      { rootMargin: '0px 0px -10% 0px', threshold: 0 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref as never}
      data-reveal=""
      className={className}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}

/**
 * Marks a single element as reveal-animated when it is not wrapped in a
 * <Reveal> container.
 */
export function RevealItem({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      data-reveal=""
      className={className}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
