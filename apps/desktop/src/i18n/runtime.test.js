import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setRuntimeI18nLocale, translateNow } from './runtime';
describe('desktop i18n runtime translator', () => {
    beforeEach(() => {
        setRuntimeI18nLocale('en');
    });
    afterEach(() => {
        setRuntimeI18nLocale('en');
    });
    it('passes arguments to function translations', () => {
        expect(translateNow('notifications.updateReadyMessage', 2)).toBe('2 new changes available.');
    });
    it('returns the key when no locale can resolve a path', () => {
        expect(translateNow('missing.path')).toBe('missing.path');
    });
});
