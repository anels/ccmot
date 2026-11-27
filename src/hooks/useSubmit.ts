import { useRef, useState } from 'react';

/** Runs one submission at a time. Disable the button while `isPending`. */
export function useSubmit() {
    const [isPending, setIsPending] = useState(false);
    const isBusy = useRef(false);

    const submit = async (action: () => Promise<void>) => {
        if (isBusy.current) return;
        isBusy.current = true;
        setIsPending(true);
        try {
            await action();
        } finally {
            isBusy.current = false;
            setIsPending(false);
        }
    };

    return [isPending, submit] as const;
}
