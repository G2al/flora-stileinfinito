import { useEffect, useRef, useState } from "react";

/**
 * Altezza (px) che l'elemento può occupare fino al fondo dello schermo
 * (sopra la barra di navigazione mobile, se visibile). Serve a far scorrere
 * solo il calendario e non tutta la pagina.
 */
export function useFillHeight(min = 360) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(520);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const top = el.getBoundingClientRect().top;
      const nav = document.getElementById("bottom-nav");
      let reserve = 16;
      if (nav && getComputedStyle(nav).display !== "none") {
        reserve = window.innerHeight - nav.getBoundingClientRect().top + 8;
      }
      setHeight(Math.max(min, Math.floor(window.innerHeight - top - reserve)));
    };

    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    if (el.parentElement) ro.observe(el.parentElement);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [min]);

  return { ref, height };
}
