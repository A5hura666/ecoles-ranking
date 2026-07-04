"use client";

import { useEffect, useRef } from "react";

interface Props {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/** Popup de confirmation accessible : remplace `window.confirm`, qui ne
 *  peut pas être stylé et bloque le thread principal. Ferme sur Échap ou
 *  clic hors de la boîte, et rend le focus au bouton d'action par défaut
 *  pour rester utilisable au clavier. */
export default function ConfirmDialog({
                                          open,
                                          title,
                                          description,
                                          confirmLabel = "Confirmer",
                                          cancelLabel = "Annuler",
                                          destructive = false,
                                          onConfirm,
                                          onCancel,
                                      }: Props) {
    const confirmRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        confirmRef.current?.focus();

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onCancel();
        }
        document.addEventListener("keydown", onKeyDown);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-ink/50 backdrop-blur-[2px] dialog-fade"
                onClick={onCancel}
            />
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby={description ? "confirm-dialog-desc" : undefined}
                className="relative w-full max-w-sm bg-paper border border-line rounded-sm shadow-xl p-6 dialog-pop"
            >
                <h2 id="confirm-dialog-title" className="font-display text-lg text-ink mb-2">
                    {title}
                </h2>
                {description && (
                    <p
                        id="confirm-dialog-desc"
                        className="text-sm text-ink/60 mb-6 leading-relaxed"
                    >
                        {description}
                    </p>
                )}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="text-sm px-4 py-2 rounded-sm border border-line text-ink/70 hover:bg-wheat/40 transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        ref={confirmRef}
                        onClick={onConfirm}
                        className={`text-sm px-4 py-2 rounded-sm border font-medium transition-colors ${
                            destructive
                                ? "border-clay bg-clay text-paper hover:bg-clay/90"
                                : "border-moss bg-moss text-paper hover:bg-moss/90"
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .dialog-fade {
                    animation: dialogFadeIn 0.18s ease-out;
                }
                .dialog-pop {
                    animation: dialogPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes dialogFadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes dialogPopIn {
                    from {
                        opacity: 0;
                        transform: scale(0.94) translateY(4px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .dialog-fade,
                    .dialog-pop {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}