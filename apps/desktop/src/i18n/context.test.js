import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n } from './context';
function LanguageProbe({ target = 'en' }) {
    const { isLoadingConfig, isSavingLocale, locale, saveError, setLocale, t } = useI18n();
    return (_jsxs("div", { children: [_jsx("p", { "data-testid": "locale", children: locale }), _jsx("p", { "data-testid": "label", children: t.language.label }), _jsx("p", { "data-testid": "save", children: t.common.save }), _jsx("p", { "data-testid": "loading", children: String(isLoadingConfig) }), _jsx("p", { "data-testid": "saving", children: String(isSavingLocale) }), _jsx("p", { "data-testid": "save-error", children: saveError?.message ?? '' }), _jsx("button", { onClick: () => void setLocale(target).catch(() => undefined), type: "button", children: "switch" })] }));
}
describe('I18nProvider', () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });
    it('defaults to English without a config client', () => {
        render(_jsx(I18nProvider, { configClient: null, children: _jsx(LanguageProbe, {}) }));
        expect(screen.getByTestId('locale').textContent).toBe('en');
        expect(screen.getByTestId('label').textContent).toBe('Language');
    });
    it('keeps English usable when config loading fails', async () => {
        const configClient = {
            getConfig: vi.fn().mockRejectedValue(new Error('config unavailable')),
            saveConfig: vi.fn()
        };
        render(_jsx(I18nProvider, { configClient: configClient, initialLocale: "en", children: _jsx(LanguageProbe, {}) }));
        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
        expect(screen.getByTestId('locale').textContent).toBe('en');
        expect(screen.getByTestId('label').textContent).toBe('Language');
        expect(configClient.saveConfig).not.toHaveBeenCalled();
    });
    it('does not overwrite unsupported configured languages', async () => {
        const configClient = {
            getConfig: vi.fn().mockResolvedValue({ display: { language: 'de' } }),
            saveConfig: vi.fn()
        };
        render(_jsx(I18nProvider, { configClient: configClient, children: _jsx(LanguageProbe, {}) }));
        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
        expect(screen.getByTestId('locale').textContent).toBe('en');
        expect(screen.getByTestId('label').textContent).toBe('Language');
        expect(configClient.saveConfig).not.toHaveBeenCalled();
    });
    it('reads latest config before saving language and preserves unrelated values', async () => {
        const saveConfig = vi.fn().mockResolvedValue({ ok: true });
        const latestConfig = {
            display: { language: 'en', skin: 'slate' },
            terminal: { cwd: '/new' }
        };
        const configClient = {
            getConfig: vi
                .fn()
                .mockResolvedValueOnce({ display: { language: 'en', skin: 'mono' }, terminal: { cwd: '/old' } })
                .mockResolvedValueOnce(latestConfig),
            saveConfig
        };
        render(_jsx(I18nProvider, { configClient: configClient, children: _jsx(LanguageProbe, {}) }));
        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
        fireEvent.click(screen.getByRole('button', { name: 'switch' }));
        await waitFor(() => expect(saveConfig).toHaveBeenCalledTimes(1));
        expect(saveConfig).toHaveBeenCalledWith({
            display: { language: 'en', skin: 'slate' },
            terminal: { cwd: '/new' }
        });
    });
    it('rolls back the visible locale when saving fails', async () => {
        const configClient = {
            getConfig: vi.fn().mockResolvedValue({ display: { language: 'en' } }),
            saveConfig: vi.fn().mockRejectedValue(new Error('save failed'))
        };
        render(_jsx(I18nProvider, { configClient: configClient, children: _jsx(LanguageProbe, {}) }));
        await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
        fireEvent.click(screen.getByRole('button', { name: 'switch' }));
        await waitFor(() => expect(screen.getByTestId('save-error').textContent).toBe('save failed'));
        expect(screen.getByTestId('locale').textContent).toBe('en');
        expect(screen.getByTestId('label').textContent).toBe('Language');
    });
});
