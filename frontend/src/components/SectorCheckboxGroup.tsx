import React from 'react';

interface SectorCheckboxGroupProps {
    isVisible: boolean;
    title: string;
    options: string[];
    selectedItems: string[];
    otherValue?: string;
    listPath: string;
    otherPath: string;
    colorTheme?: 'blue' | 'purple' | 'amber' | 'emerald' | 'cyan' | 'rose' | 'indigo' | 'orange' | 'yellow';
    onToggle: (path: string, value: string) => void;
    onChange: (path: string, value: string) => void;
    getInputClass: (path: string) => string;
}

const colorClasses = {
    blue: { border: 'border-blue-500', bg: 'bg-blue-500/5', text: 'text-blue-300' },
    purple: { border: 'border-purple-500', bg: 'bg-purple-500/5', text: 'text-purple-300' },
    amber: { border: 'border-amber-500', bg: 'bg-amber-500/5', text: 'text-amber-300' },
    emerald: { border: 'border-emerald-500', bg: 'bg-emerald-500/5', text: 'text-emerald-300' },
    cyan: { border: 'border-cyan-500', bg: 'bg-cyan-500/5', text: 'text-cyan-300' },
    rose: { border: 'border-rose-500', bg: 'bg-rose-500/5', text: 'text-rose-300' },
    indigo: { border: 'border-indigo-500', bg: 'bg-indigo-500/5', text: 'text-indigo-300' },
    orange: { border: 'border-orange-500', bg: 'bg-orange-500/5', text: 'text-orange-300' },
    yellow: { border: 'border-yellow-600', bg: 'bg-yellow-600/5', text: 'text-yellow-300' },
};

export const SectorCheckboxGroup: React.FC<SectorCheckboxGroupProps> = ({
    isVisible,
    title,
    options,
    selectedItems = [],
    otherValue = '',
    listPath,
    otherPath,
    colorTheme = 'blue',
    onToggle,
    onChange,
    getInputClass,
}) => {
    if (!isVisible) return null;

    const theme = colorClasses[colorTheme] || colorClasses.blue;

    return (
        <div className={`md:col-span-2 border-l-2 ${theme.border} pl-4 py-1 my-2 ${theme.bg} rounded-r-lg`}>
            <label className={`block text-xs font-medium ${theme.text} mb-2`}>
                {title}: <span className="text-red-400">*</span>
            </label>
            <div className="space-y-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                {options.map((item) => {
                    const isChecked = selectedItems.includes(item);
                    return (
                        <div key={item} className="flex flex-col gap-2">
                            <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer select-none hover:text-white transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => onToggle(listPath, item)}
                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-700 bg-slate-950 accent-blue-600 focus:ring-1 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer [color-scheme:dark]"
                                />
                                <span>{item}</span>
                            </label>

                            {item === 'Otro especifica' && isChecked && (
                                <div className="ml-7 mt-1">
                                    <textarea
                                        rows={2}
                                        placeholder={`Por favor, especifique la opción de ${title.toLowerCase()}...`}
                                        value={otherValue}
                                        onChange={(e) => onChange(otherPath, e.target.value)}
                                        className={getInputClass(otherPath)}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};