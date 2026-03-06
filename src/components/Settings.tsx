import React, { useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { useTheme } from '../hooks/useTheme';
import { ConfirmDialog } from './ConfirmDialog';
import { AlertDialog } from './AlertDialog';
import { Download, Upload, Save, AlertTriangle, Moon, Sun, Monitor } from 'lucide-react';

interface PendingImport {
    data: {
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
                if (Array.isArray(data.cards) && Array.isArray(data.offers) && Array.isArray(data.trackedOffers)) {
                    // Show confirmation dialog instead of window.confirm
                    setConfirmImport({ data });
                } else {
                    showAlert('Invalid File', 'Invalid file format. Missing required arrays: cards, offers, or trackedOffers.', 'error');
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
                await importData(confirmImport.data as Parameters<typeof importData>[0]);
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

            <h2 className="text-2xl font-bold">Settings</h2>

            {/* Appearance Settings */}
            <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Monitor className="w-5 h-5 mr-2" />
                    Appearance
                </h3>
                <p className="text-muted-foreground mb-6">
                    Customize the look and feel of the application.
                </p>

                <div className="grid grid-cols-3 gap-4">
                    <button
                        onClick={() => setTheme("light")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'light'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-transparent bg-secondary/50 hover:bg-secondary'
                            }`}
                    >
                        <Sun className="w-6 h-6 mb-2" />
                        <span className="font-medium">Light</span>
                    </button>

                    <button
                        onClick={() => setTheme("dark")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-transparent bg-secondary/50 hover:bg-secondary'
                            }`}
                    >
                        <Moon className="w-6 h-6 mb-2" />
                        <span className="font-medium">Dark</span>
                    </button>

                    <button
                        onClick={() => setTheme("system")}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'system'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-transparent bg-secondary/50 hover:bg-secondary'
                            }`}
                    >
                        <Monitor className="w-6 h-6 mb-2" />
                        <span className="font-medium">System</span>
                    </button>
                </div>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Save className="w-5 h-5 mr-2" />
                    Data Synchronization
                </h3>
                <p className="text-muted-foreground mb-6">
                    Backup your data to a JSON file or restore from an existing backup.
                    You can save this file to your OneDrive to sync between devices.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center px-4 py-2 border rounded-md hover:bg-muted transition-colors"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Import Data
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImport}
                        accept=".json"
                        className="hidden"
                    />
                </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center text-yellow-800 dark:text-yellow-500">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Note on Syncing
                </h3>
                <div className="text-sm text-yellow-700 dark:text-yellow-400 space-y-2">
                    <p>
                        To sync between PC and Mobile:
                    </p>
                    <ol className="list-decimal list-inside ml-2">
                        <li>Export data from Device A.</li>
                        <li>Save the file to a cloud folder (OneDrive, iCloud, GDrive).</li>
                        <li>Open this app on Device B.</li>
                        <li>Import the file from the cloud folder.</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default Settings;
