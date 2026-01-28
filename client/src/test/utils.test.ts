import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('Utility: cn', () => {
    it('should merge tailwind classes correctly', () => {
        const result = cn('text-red-500', 'bg-blue-500');
        expect(result).toContain('text-red-500');
        expect(result).toContain('bg-blue-500');
    });

    it('should handle conditional classes', () => {
        const result = cn('base', true && 'active', false && 'hidden');
        expect(result).toBe('base active');
    });
});
