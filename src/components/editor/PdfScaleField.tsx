import type { SiteLocale } from '@/lib/i18n/locales';
import { getEditorTranslator } from '@/lib/editor/messages';
import { isPdfScaleMode, type PdfScaleMode } from '@/lib/editor/pdf-scale';

type PdfScaleFieldProps = {
    locale: SiteLocale;
    id: string;
    value: PdfScaleMode;
    supportsActualSize: boolean;
    onChange: (value: PdfScaleMode) => void;
};

export function PdfScaleField({ locale, id, value, supportsActualSize, onChange }: PdfScaleFieldProps) {
    const t = getEditorTranslator(locale);
    const helpId = `${id}-help`;
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-semibold">{t('PDF scale')}</label>
            <select
                id={id}
                name="pdfScaleMode"
                value={value}
                aria-describedby={helpId}
                onChange={(event) => {
                    if (isPdfScaleMode(event.target.value)) onChange(event.target.value);
                }}
                className="min-h-11 w-full appearance-auto rounded-lg border border-[#d9ded5] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#28614e]/35"
            >
                <option value="fit-page">{t('Page-fit counting chart')}</option>
                <option value="midi-5mm" disabled={!supportsActualSize}>{t('5 mm Midi actual size')}</option>
            </select>
            <p id={helpId} className="mt-2 text-xs leading-5 text-[#627168]">
                {t(value === 'midi-5mm'
                    ? 'Print the 5 mm grid at 100% with page scaling off. Check the calibration mark before placing beads. This setting is saved in your project.'
                    : 'Page-fit charts are for counting beads, not placing directly on a pegboard. This setting is saved in your project.')}
            </p>
            {!supportsActualSize && (
                <p role={value === 'midi-5mm' ? 'alert' : undefined} className="mt-2 rounded-lg border border-[#d9ded5] bg-brand-yellow p-2 text-xs leading-5 text-brutal-black">
                    {t('5 mm actual-size PDF requires a 29 × 29 Midi board and only Perler Midi, Hama Midi or Artkal S palettes. Choose a page-fit chart or change the setup.')}
                </p>
            )}
        </div>
    );
}
