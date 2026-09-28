"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";

function GlobePlaceholder({ unavailable = false }: { unavailable?: boolean }) {
  return (
    <div className="flex aspect-square items-center justify-center border border-acid/15 p-8 text-center text-sm text-white/60" role="status">
      {unavailable ? "The interactive globe is unavailable on this device. We support the Philippines, Australia, Canada, and the United States." : "Loading our world…"}
    </div>
  );
}

const ServicesGlobe = dynamic(() => import("./ServicesGlobe"), {
  ssr: false,
  loading: () => <GlobePlaceholder />,
});

class GlobeBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <GlobePlaceholder unavailable /> : this.props.children; }
}

export default function ServicesGlobeLoader() {
  const container = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting) setLoaded(true);
    }, { rootMargin: "150px" });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={container} className="min-w-0">
      <GlobeBoundary>
        {loaded ? <ServicesGlobe visible={visible} /> : <GlobePlaceholder />}
      </GlobeBoundary>
    </div>
  );
}
