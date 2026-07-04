import { useEffect, useRef, useState } from "react";

/** Ne devient `true` que lorsque l'élément entre dans le viewport (avec une
 *  marge), puis le reste — évite de monter ~80 cartes Leaflet d'un coup au
 *  premier rendu de la liste. */
export function useInView<T extends HTMLElement>(rootMargin = "300px") {
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || inView) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [inView, rootMargin]);

    return { ref, inView };
}