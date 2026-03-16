import {
    type ReactElement
} from 'react';
import {
    FileX
} from 'lucide-react';

const PageBreakBlock = (): ReactElement => {
    
    return (
        <div className="flex items-center gap-3 py-2 select-none">
            <div className="flex-1 border-t-2 border-dashed border-black/15" />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 text-black/35 text-xs font-medium">
                <FileX className="w-3.5 h-3.5" />
                Page Break
            </div>
            <div className="flex-1 border-t-2 border-dashed border-black/15" />
        </div>
    );
}

export default PageBreakBlock;