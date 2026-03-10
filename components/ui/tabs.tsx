'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

interface TabsProps {
    defaultValue: string;
    children: ReactNode;
    className?: string;
}

interface TabsListProps {
    children: ReactNode;
    className?: string;
}

interface TabsTriggerProps {
    value: string;
    children: ReactNode;
    className?: string;
}

interface TabsContentProps {
    value: string;
    children: ReactNode;
    className?: string;
}

interface TabsContextType {
    activeTab: string;
    setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabsContext() {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('Tabs component must be used within Tabs');
    }
    return context;
}

export function Tabs({ defaultValue, children, className = '' }: TabsProps) {
    const [activeTab, setActiveTab] = useState(defaultValue);

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={`w-full ${className}`}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className = '' }: TabsListProps) {
    return (
        <div
            className={`grid grid-cols-3 gap-0 rounded-lg border border-white/10 bg-white/5 p-1 ${className}`}
            role="tablist"
        >
            {children}
        </div>
    );
}

export function TabsTrigger({ value, children, className = '' }: TabsTriggerProps) {
    const { activeTab, setActiveTab } = useTabsContext();
    const isActive = activeTab === value;

    return (
        <button
            role="tab"
            aria-selected={isActive}
            onClick={() => setActiveTab(value)}
            className={`rounded px-4 py-2 text-sm font-semibold transition-colors ${isActive
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                    : 'text-zinc-400 hover:text-white'
                } ${className}`}
        >
            {children}
        </button>
    );
}

export function TabsContent({ value, children, className = '' }: TabsContentProps) {
    const { activeTab } = useTabsContext();

    if (activeTab !== value) return null;

    return (
        <div className={`mt-6 w-full ${className}`} role="tabpanel">
            {children}
        </div>
    );
}
