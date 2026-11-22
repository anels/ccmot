import { useEffect, useRef } from 'react';

// Open dialogs, outermost first. Shared so stacked dialogs keep the body
// scroll lock until the last one closes and only the topmost one handles Escape.
const openLayers: symbol[] = [];
let savedBodyOverflow: string | null = null;

export function useDialogLayer(isOpen: boolean, onClose: () => void) {
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        if (!isOpen) return;

        const layer = Symbol('dialog');
        if (openLayers.length === 0) {
            savedBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }
        openLayers.push(layer);

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && openLayers[openLayers.length - 1] === layer) {
                onCloseRef.current();
            }
        };
        document.addEventListener('keydown', onKey);

        return () => {
            document.removeEventListener('keydown', onKey);
            openLayers.splice(openLayers.indexOf(layer), 1);
            if (openLayers.length === 0) {
                document.body.style.overflow = savedBodyOverflow ?? '';
                savedBodyOverflow = null;
            }
        };
    }, [isOpen]);
}
