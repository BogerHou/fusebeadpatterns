import type { SiteLocale } from '../../lib/i18n/locales';
import { getEditorTranslator } from '../../lib/editor/messages';
import { isPdfPaperSize, type PdfPaperSize } from '../../lib/editor/pdf-paper';

type PdfPaperFieldProps = {
    locale: SiteLocale;
    id: string;
    value: PdfPaperSize;
    onChange: (value: PdfPaperSize) => void;
};

export function PdfPaperField({ locale, id, value, onChange }: PdfPaperFieldProps) {
    const t = getEditorTranslator(locale);
    const helpId = `${id}-help`;
    return <div>
        <label htmlFor={id} className="mb-1 block text-sm font-semibold">{t('PDF paper size')}</label>
        <select
            id={id}
            name="pdfPaperSize"
            value={value}
            aria-describedby={helpId}
            onChange={event => {
                if (isPdfPaperSize(event.target.value)) onChange(event.target.value);
            }}
            className="min-h-11 w-full appearance-auto rounded-lg border border-[#d9ded5] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#28614e]/35"
        >
            <option value="a4">{t('A4 (210 × 297 mm)')}</option>
            <option value="letter">{t('US Letter (8.5 × 11 in)')}</option>
        </select>
        <p id={helpId} className="mt-2 text-xs leading-5 text-[#627168]">
            {t('Choose the paper in your printer. Paper size is saved in your project; changing it does not change beads or board layout.')}
        </p>
    </div>;
}
