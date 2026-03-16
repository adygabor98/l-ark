import {
    useRef,
    useState,
    type ReactElement
} from 'react';
import {
    Eraser
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

const ProfessionalSignature = ({ label }: any): ReactElement => {
    const padRef = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const clear = () => {
        padRef.current?.clear();
        setIsEmpty(true);
    };

    // This is where the magic happens for professional-looking ink
    const penOptions = {
        minWidth: 0.5,
        maxWidth: 2.5,
        velocityFilterWeight: 0.7,
        penColor: '#1e293b'
    };

    return (
        <div className="max-w-md w-full mx-auto space-y-3">
            <div className="flex  justify-between items-end px-1">
                <label className="w-full text-center text-xs font-[Lato-Regular] text-slate-500 uppercase tracking-wider">
                    { label }
                </label>
                { !isEmpty &&
                    <button onClick={() => clear()}
                        className="ml-2 flex items-center gap-1 text-[10px] text-black/35 hover:text-red-500 transition-colors"
                        title="Clear signature"
                    >
                        <Eraser className="w-2.5 h-2.5" />
                        Clear
                    </button>
                }
            </div>

            <div className="relative group border border-dashed border-black/30 rounded-lg">
                {/* The "Paper" Container */}
                <div className="relative h-18 bg-slate-50 rounded-xl transition-all group-hover:bg-white overflow-hidden">
                    <SignatureCanvas 
                        ref={padRef}
                        onBegin={() => setIsEmpty(false)}
                        canvasProps={{
                            className: "w-full h-full cursor-crosshair",
                        }}
                        {...penOptions}
                    />

                    {/* Placeholder Overlay */}
                    { isEmpty &&
                        <span className="absolute inset-0 flex items-center justify-center text-xs text-black/25 pointer-events-none italic select-none">
                            Sign here
                        </span>
                    }
                </div>
            </div>
        </div>
    );
};

export default ProfessionalSignature;