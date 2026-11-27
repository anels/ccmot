type SaveFilePickerOptions = {
    suggestedName?: string;
    types?: {
        description: string;
        accept: Record<string, string[]>;
    }[];
};

type WritableFileHandle = {
    write: (data: string) => Promise<void> | void;
    close: () => Promise<void> | void;
};

type FilePickerHandle = {
    createWritable: () => Promise<WritableFileHandle>;
};

type WindowWithFilePicker = Window & {
    showSaveFilePicker?: (options: SaveFilePickerOptions) => Promise<FilePickerHandle>;
};

/** Saves through the browser's download. */
export function downloadJson(filename: string, data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** Lets the person pick where to save where the browser can, and downloads otherwise. */
export async function saveJson(filename: string, data: unknown) {
    try {
        const saveFilePicker = (window as WindowWithFilePicker).showSaveFilePicker;
        if (saveFilePicker) {
            const handle = await saveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
            return;
        }
    } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return; // User cancelled
        console.warn('File System Access API failed, falling back to download', err);
    }

    downloadJson(filename, data);
}
