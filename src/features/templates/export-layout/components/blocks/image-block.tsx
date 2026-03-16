import {
    useRef,
    type ReactElement
} from 'react';
import {
    Image,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Upload
} from 'lucide-react';
import {
    useExportLayout
} from '../../export-layout.context';
import type {
    ExportBlock
} from '../../export-layout.models';

interface ImageBlockProps {
    block: ExportBlock;
}

const ImageBlock = ({ block }: ImageBlockProps): ReactElement => {
    const { dispatch } = useExportLayout();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = e => {
            dispatch({ type: 'UPDATE_BLOCK', payload: { blockId: block.id, updates: { imageUrl: e.target?.result as string } } });
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];

        if (file && file.type.startsWith('image/')) handleFile(file);
    };

    const alignment = block.settings.imageAlignment ?? 'left';
    const alignClass = alignment === 'center' ? 'mx-auto' : alignment === 'right' ? 'ml-auto' : '';

    return (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Image className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-[Lato-Regular] text-purple-700"> Image Block </span>

                { block.imageUrl &&
                    <div className="flex gap-1 ml-auto">
                        {(['left', 'center', 'right'] as const).map(a => {
                            const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight;

                            return (
                                <button key={a} onClick={() => dispatch({ type: 'UPDATE_BLOCK_SETTINGS', payload: { blockId: block.id, settings: { imageAlignment: a } } })}
                                    className={`p-1 rounded ${alignment === a ? 'bg-purple-200 text-purple-700' : 'text-purple-400 hover:bg-purple-100'}`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                </button>
                            );
                        })}
                    </div>
                }
            </div>

            { block.imageUrl ?
                <div className={`relative group ${alignClass}`} style={{ width: block.settings.imageWidth ?? 200 }}>
                    <img src={block.imageUrl} alt="Document image" className="max-w-full rounded-lg border border-purple-200" style={{ width: block.settings.imageWidth ?? 200 }} />
                    <button onClick={() => dispatch({ type: 'UPDATE_BLOCK', payload: { blockId: block.id, updates: { imageUrl: undefined } } })}
                        className="absolute top-1 right-1 bg-white border border-black/10 text-black/50 rounded-md px-2 py-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        Remove
                    </button>
                </div>
            :
                <div
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-purple-300 rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-colors"
                >
                    <Upload className="w-6 h-6 text-purple-400" />
                    <span className="text-sm text-purple-500"> Click or drag an image here </span>
                    <span className="text-xs text-purple-400"> PNG, JPG, SVG </span>
                </div>
            }

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                }}
            />

            { block.imageUrl &&
                <div className="mt-3 flex items-center gap-2">
                    <label className="text-xs text-purple-600"> Width (px) </label>
                    <input
                        type="number"
                        value={block.settings.imageWidth ?? 200}
                        min={40}
                        max={750}
                        onChange={e =>
                            dispatch({ type: 'UPDATE_BLOCK_SETTINGS', payload: { blockId: block.id, settings: { imageWidth: Number(e.target.value) } } })
                        }
                        className="w-20 text-xs border border-purple-200 rounded-lg px-2 py-1 outline-none focus:border-purple-400"
                    />
                </div>
            }
        </div>
    );
}

export default ImageBlock;