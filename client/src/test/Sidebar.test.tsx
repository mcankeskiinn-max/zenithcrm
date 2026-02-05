import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider } from '../context/ThemeContext';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Component: Sidebar', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('renders correctly for ADMIN role', () => {
        window.localStorage.setItem('user', JSON.stringify({ role: 'ADMIN', name: 'Admin User' }));

        render(
            <ThemeProvider>
                <MemoryRouter>
                    <Sidebar isOpen={true} onClose={() => { }} />
                </MemoryRouter>
            </ThemeProvider>
        );

        expect(screen.getByText('Şube Yönetimi')).toBeDefined();
        expect(screen.getByText('Sistem Günlükleri')).toBeDefined();
    });

    it('hides management links for EMPLOYEE role', () => {
        window.localStorage.setItem('user', JSON.stringify({ role: 'EMPLOYEE', name: 'Agent User' }));

        render(
            <ThemeProvider>
                <MemoryRouter>
                    <Sidebar isOpen={true} onClose={() => { }} />
                </MemoryRouter>
            </ThemeProvider>
        );

        // Management links should NOT be present
        expect(screen.queryByText('Şube Yönetimi')).toBeNull();
        expect(screen.queryByText('Sistem Günlükleri')).toBeNull();

        // Core links should be present
        expect(screen.getByText('Portföy Yönetimi')).toBeDefined();
        expect(screen.getByText('Mesajlar')).toBeDefined();
    });
});
