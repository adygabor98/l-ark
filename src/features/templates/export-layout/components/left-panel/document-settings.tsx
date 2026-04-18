import {
    type ReactElement
} from 'react';
import {
    FileText
} from 'lucide-react';
import {
    useExportLayout
} from '../../export-layout.context';
import {
    MARGINS,
    PAGE_NUMBER_OPTIONS,
    PAGE_SIZES
} from '../../export-layout.models';
import { useTranslation } from 'react-i18next';

const DocumentSettings = (): ReactElement => {
    /** Export layout api utilities */
    const { state, dispatch } = useExportLayout();
    /** Page configuration */
    const { pageConfig } = state;
    const { t } = useTranslation();

    const update = (partial: Partial<typeof pageConfig>) => {
        dispatch({ type: 'UPDATE_PAGE_CONFIG', payload: partial });
    };

    return (
        <div className="flex flex-col gap-5 p-4">
            <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-black/40" />
                <span className="text-sm font-[Lato-Regular] text-black/60"> {t('export-layout.document-settings')} </span>
            </div>

            {/* Page size */}
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-2 uppercase tracking-wide"> {t('export-layout.page-size')} </label>
                <div className="flex gap-2">
                    { PAGE_SIZES.map(size => (
                        <button
                            key={size}
                            onClick={() => update({ pageSize: size })}
                            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                pageConfig.pageSize === size
                                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                                    : 'border-black/10 text-black/50 hover:border-black/20'
                            }`}
                        >
                            { size }
                            <span className="block text-[10px] font-[Lato-Regular] opacity-60">
                                { size === 'A4' ? '210 x 297 mm' : '216 x 279 mm' }
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Margins */}
            <div>
                <label className="block text-xs font-[Lato-Regular] text-black/50 mb-2 uppercase tracking-wide"> {t('export-layout.margins')} </label>
                <div className="grid grid-cols-2 gap-2">
                    { MARGINS.map(side => (
                        <div key={side}>
                            <label className="block text-xs text-black/40 mb-1 capitalize">{side}</label>
                            <input type="number" min={0} max={50} value={pageConfig.margins[side]}
                                onChange={e =>
                                    update({ margins: { ...pageConfig.margins, [side]: Number(e.target.value) } })
                                }
                                className="w-full text-sm border border-black/10 rounded-lg px-2 py-1.5 outline-none focus:border-amber-400"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Header */}
            <div className="border border-black/8 rounded-xl p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-[Lato-Regular] text-black/60 uppercase tracking-wide"> {t('export-layout.header')} </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={pageConfig.showHeader}
                            onChange={e => update({ showHeader: e.target.checked })}
                            className="rounded accent-amber-500"
                        />
                        <span className="text-xs text-black/50"> {t('export-layout.show')} </span>
                    </label>
                </div>
                { pageConfig.showHeader &&
                    <>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={pageConfig.showLogo}
                                onChange={e => update({ showLogo: e.target.checked })}
                                className="rounded accent-amber-500"
                            />
                            <span className="text-xs text-black/60"> {t('export-layout.show-logo')} </span>
                        </label>

                        {pageConfig.showLogo &&
                            <>
                                <div>
                                    <label className="block text-xs text-black/50 mb-1">
                                        {t('export-layout.logo-size')} { pageConfig.logoWidth ?? 40 }px
                                    </label>
                                    <input
                                        type="range"
                                        min={24}
                                        max={120}
                                        value={pageConfig.logoWidth ?? 40}
                                        onChange={e => update({ logoWidth: Number(e.target.value) })}
                                        className="w-full accent-amber-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-black/30 mt-0.5">
                                        <span> 24px </span>
                                        <span> 120px </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-black/50 mb-1">
                                        {t('export-layout.logo-organization-text')}
                                    </label>
                                    <input
                                        type="text"
                                        value={pageConfig.logoOrganizationText ?? ''}
                                        onChange={e => update({ logoOrganizationText: e.target.value })}
                                        placeholder={t('export-layout.logo-organization-text-placeholder')}
                                        className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 outline-none focus:border-amber-400"
                                    />
                                </div>
                            </>
                        }

                        <p className="text-[11px] text-black/35 italic leading-relaxed">
                            {t('export-layout.header-hint')}
                        </p>
                    </>
                }
            </div>

            {/* Footer */}
            <div className="border border-black/8 rounded-xl p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-[Lato-Regular] text-black/60 uppercase tracking-wide"> {t('export-layout.footer')} </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={pageConfig.showFooter}
                            onChange={e => update({ showFooter: e.target.checked })}
                            className="rounded accent-amber-500"
                        />
                        <span className="text-xs text-black/50"> {t('export-layout.show')} </span>
                    </label>
                </div>
                {pageConfig.showFooter &&
                    <>
                        <div>
                            <label className="block text-xs text-black/50 mb-2">{t('export-layout.page-numbers')}</label>
                            <div className="grid grid-cols-4 gap-1">
                                { PAGE_NUMBER_OPTIONS.map(({ value, icon, label }) => (
                                    <button
                                        key={value}
                                        title={label}
                                        onClick={() => update({ pageNumberPosition: value })}
                                        className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-xs transition-colors ${
                                            pageConfig.pageNumberPosition === value
                                                ? 'border-amber-400 bg-amber-50 text-amber-700'
                                                : 'border-black/10 text-black/40 hover:border-black/20'
                                        }`}
                                    >
                                        { icon }
                                        <span className="text-[10px]"> { label } </span>
                                    </button>
                                )) }
                            </div>
                            { pageConfig.pageNumberPosition !== 'none' &&
                                <p className="mt-2 text-xs text-black/40 italic">
                                    {t('export-layout.page-numbers-hint')}
                                </p>
                            }
                        </div>

                        <p className="text-[11px] text-black/35 italic leading-relaxed">
                            {t('export-layout.footer-hint')}
                        </p>
                    </>
                }
            </div>

            {/* Watermark */}
            <div className="border border-black/8 rounded-xl p-3 flex flex-col gap-3">
                <span className="text-xs font-[Lato-Regular] text-black/60 uppercase tracking-wide"> {t('export-layout.watermark')} </span>
                <div>
                    <label className="block text-xs text-black/50 mb-1"> {t('export-layout.watermark-text')} </label>
                    <input
                        type="text"
                        value={pageConfig.watermark ?? ''}
                        onChange={e => update({ watermark: e.target.value })}
                        placeholder={t('export-layout.watermark-placeholder')}
                        className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 outline-none focus:border-amber-400"
                    />
                    <p className="mt-1 text-[11px] text-black/35 italic"> {t('export-layout.watermark-hint')} </p>
                </div>

                { (pageConfig.watermark ?? '').length > 0 &&
                    <>
                        {/* Color */}
                        <div>
                            <label className="block text-xs text-black/50 mb-1"> {t('export-layout.watermark-color')} </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={pageConfig.watermarkColor ?? '#000000'}
                                    onChange={e => update({ watermarkColor: e.target.value })}
                                    className="w-7 h-7 rounded border border-black/10 cursor-pointer p-0.5"
                                />
                                <input
                                    type="text"
                                    value={pageConfig.watermarkColor ?? '#000000'}
                                    onChange={e => update({ watermarkColor: e.target.value })}
                                    className="flex-1 text-xs border border-black/10 rounded-lg px-2 py-1.5 outline-none focus:border-amber-400 font-mono"
                                />
                            </div>
                        </div>

                        {/* Opacity */}
                        <div>
                            <label className="block text-xs text-black/50 mb-1">
                                {t('export-layout.watermark-opacity')} { Math.round((pageConfig.watermarkOpacity ?? 0.08) * 100) }%
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={30}
                                value={Math.round((pageConfig.watermarkOpacity ?? 0.08) * 100)}
                                onChange={e => update({ watermarkOpacity: Number(e.target.value) / 100 })}
                                className="w-full accent-amber-500"
                            />
                            <div className="flex justify-between text-[10px] text-black/30 mt-0.5">
                                <span> 1% </span>
                                <span> 30% </span>
                            </div>
                        </div>
                    </>
                }
            </div>
            {/* Sidebar brand band */}
            <div className="border border-black/8 rounded-xl p-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-[Lato-Regular] text-black/60 uppercase tracking-wide"> Sidebar Band </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={pageConfig.showSidebar}
                            onChange={e => update({ showSidebar: e.target.checked })}
                            className="rounded accent-amber-500"
                        />
                        <span className="text-xs text-black/50"> {t('export-layout.show')} </span>
                    </label>
                </div>

                { pageConfig.showSidebar &&
                    <>
                        {/* Position */}
                        <div>
                            <label className="block text-xs text-black/50 mb-1"> Position </label>
                            <div className="flex gap-2">
                                { (['left', 'right'] as const).map(pos => (
                                    <button key={pos}
                                        onClick={() => update({ sidebarPosition: pos })}
                                        className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors capitalize ${
                                            (pageConfig.sidebarPosition ?? 'left') === pos
                                                ? 'border-amber-400 bg-amber-50 text-amber-700'
                                                : 'border-black/10 text-black/50 hover:border-black/20'
                                        }`}
                                    >
                                        {pos}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Width */}
                        <div>
                            <label className="block text-xs text-black/50 mb-1">
                                Width: {pageConfig.sidebarWidth ?? 8}mm
                            </label>
                            <input
                                type="range"
                                min={4}
                                max={25}
                                value={pageConfig.sidebarWidth ?? 8}
                                onChange={e => update({ sidebarWidth: Number(e.target.value) })}
                                className="w-full accent-amber-500"
                            />
                        </div>

                        {/* Background color */}
                        <div>
                            <label className="block text-xs text-black/50 mb-1"> Background </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={pageConfig.sidebarColor ?? '#1a1a2e'}
                                    onChange={e => update({ sidebarColor: e.target.value })}
                                    className="w-7 h-7 rounded border border-black/10 cursor-pointer p-0.5"
                                />
                                <input
                                    type="text"
                                    value={pageConfig.sidebarColor ?? '#1a1a2e'}
                                    onChange={e => update({ sidebarColor: e.target.value })}
                                    className="flex-1 text-xs border border-black/10 rounded-lg px-2 py-1.5 outline-none focus:border-amber-400 font-mono"
                                />
                            </div>
                        </div>

                        {/* Vertical text */}
                        <div>
                            <label className="block text-xs text-black/50 mb-1"> Text (vertical) </label>
                            <input
                                type="text"
                                value={pageConfig.sidebarText ?? ''}
                                onChange={e => update({ sidebarText: e.target.value })}
                                placeholder="e.g. COMPANY NAME"
                                className="w-full text-sm border border-black/10 rounded-lg px-3 py-2 outline-none focus:border-amber-400"
                            />
                        </div>

                        {/* Text color */}
                        <div>
                            <label className="block text-xs text-black/50 mb-1"> Text Color </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={pageConfig.sidebarTextColor ?? '#ffffff'}
                                    onChange={e => update({ sidebarTextColor: e.target.value })}
                                    className="w-7 h-7 rounded border border-black/10 cursor-pointer p-0.5"
                                />
                                <span className="text-xs text-black/40 font-mono">{pageConfig.sidebarTextColor ?? '#ffffff'}</span>
                            </div>
                        </div>

                        {/* Font size */}
                        <div>
                            <label className="block text-xs text-black/50 mb-1">
                                Font Size: {pageConfig.sidebarFontSize ?? 14}px
                            </label>
                            <input
                                type="range"
                                min={8}
                                max={32}
                                value={pageConfig.sidebarFontSize ?? 14}
                                onChange={e => update({ sidebarFontSize: Number(e.target.value) })}
                                className="w-full accent-amber-500"
                            />
                        </div>
                    </>
                }
            </div>
        </div>
    );
}

export default DocumentSettings;