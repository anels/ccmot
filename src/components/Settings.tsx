import React, { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { useTheme } from '../hooks/useTheme';
import { ConfirmDialog } from './ConfirmDialog';
import { AlertDialog } from './AlertDialog';
import { Download, Upload, Save, AlertTriangle, Moon, Sun, Monitor } from 'lucide-react';
import type { AppData } from '../types';

interface PendingImport {
    data: Partial<AppData> & {
        cards: unknown[];
        offers: unknown[];
        trackedOffers: unknown[];
    };
}

const Settings: React.FC = () => {
    const { exportData, importData } = useStore();
    const { theme, setTheme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // State for custom dialogs
    const [confirmImport, setConfirmImport] = useState<PendingImport | null>(null);
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'success' | 'error' | 'info';
    }>({ isOpen: false, title: '', message: '', variant: 'info' });

    const showAlert = (title: string, message: string, variant: 'success' | 'error' | 'info' = 'info') => {
        setAlertState({ isOpen: true, title, message, variant });
    };

    const handleExport = () => {
        const data = exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ccmot-backup-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = event.target?.result as string;
                const data = JSON.parse(json);
                // Validate required arrays exist
                const hasRequiredArrays = Array.isArray(data.cards) && Array.isArray(data.offers) && Array.isArray(data.trackedOffers);
                const hasValidOptionalArrays = (data.cardTypes === undefined || Array.isArray(data.cardTypes))
                    && (data.rewards === undefined || Array.isArray(data.rewards));
                if (hasRequiredArrays && hasValidOptionalArrays) {
                    // Show confirmation dialog instead of window.confirm
                    setConfirmImport({ data });
                } else {
                    showAlert('Invalid File', 'Invalid file format. Expected cards, offers, trackedOffers, cardTypes, and rewards arrays.', 'error');
                }
            } catch (err) {
                console.error(err);
                showAlert('Parse Error', 'Failed to parse JSON file. Please ensure the file is valid JSON.', 'error');
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleConfirmImport = async () => {
        if (confirmImport) {
            try {
                await importData(confirmImport.data);
                showAlert('Import Successful', 'Your data has been imported successfully.', 'success');
            } catch (err) {
                console.error(err);
                showAlert('Import Failed', 'Failed to import data. Please try again.', 'error');
            }
            setConfirmImport(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Custom Dialogs */}
            <ConfirmDialog
                isOpen={!!confirmImport}
                onClose={() => setConfirmImport(null)}
                onConfirm={handleConfirmImport}
                title="Import Data"
                message="This will overwrite your current data. Are you sure you want to continue?"
                confirmText="Import"
                cancelText="Cancel"
                variant="warning"
            />
            <AlertDialog
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                variant={alertState.variant}
            />

            <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Preferences</p>
                <h1 className="text-3xl font-semibold tracking-tight mt-1">Settings</h1>
            </div>

            {/* Appearance */}
            <section className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                        Appearance
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Theme used across the app.</p>
                </div>
                <div className="p-5">
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'light', label: 'Light', Icon: Sun },
                            { id: 'dark', label: 'Dark', Icon: Moon },
                            { id: 'system', label: 'System', Icon: Monitor },
                        ].map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                onClick={() => setTheme(id as typeof theme)}
                                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-md border transition-colors ${theme === id
                                    ? 'border-foreground bg-foreground/5'
                                    : 'border-border bg-card hover:bg-accent'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Data sync */}
            <section className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                        <Save className="w-3.5 h-3.5 text-muted-foreground" />
                        Data
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Export your data or import from a backup file.</p>
                </div>
                <div className="p-5 flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={handleExport}
                        className="h-9 px-3 inline-flex items-center justify-center gap-1.5 bg-foreground text-background rounded-md hover:bg-foreground/85 transition-colors text-xs font-medium uppercase tracking-wider"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9 px-3 inline-flex items-center justify-center gap-1.5 border border-border bg-card rounded-md hover:bg-accent transition-colors text-xs font-medium uppercase tracking-wider"
                    >
                        <Upload className="w-3.5 h-3.5" />
                        Import
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".json"
                        className="hidden"
                    />
                </div>
            </section>

            {/* Sync note */}
            <section className="bg-warning-soft border border-warning/30 rounded-lg p-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5 text-warning">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Cross-Device Sync
                </h3>
                <ol className="mt-2 text-xs text-foreground/80 list-decimal list-inside space-y-0.5">
                    <li>Export data from Device A.</li>
                    <li>Save the file to a cloud folder (OneDrive, iCloud, GDrive).</li>
                    <li>Open this app on Device B.</li>
                    <li>Import the file from the cloud folder.</li>
                </ol>
            </section>
        </div>
    );
};

export default Settings;
