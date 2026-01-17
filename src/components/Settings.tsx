import React, { useRef } from 'react';
import { useStore } from '../lib/store';
import { Download, Upload, Save, AlertTriangle } from 'lucide-react';

const Settings: React.FC = () => {
    const { exportData, importData } = useStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                const data = JSON.parse(json);
                // Basic validation
                if (Array.isArray(data.cards) && Array.isArray(data.offers)) {
                    if (window.confirm('This will overwrite your current data. Are you sure?')) {
                        importData(data);
                        alert('Data imported successfully!');
                    }
                } else {
                    alert('Invalid file format. Missing cards or offers arrays.');
                }
            } catch (err) {
                console.error(err);
                alert('Failed to parse JSON file.');
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">Settings</h2>

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
