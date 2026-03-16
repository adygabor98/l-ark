import {
    type ReactElement
} from 'react';
import type {
    ExportBlock
} from '../../export-layout.models';

interface DividerBlockProps {
    block: ExportBlock;
}

const DividerBlock = ({ block }: DividerBlockProps): ReactElement => {
    const weight = block.settings.lineWeight ?? 1;
    const color = block.settings.lineColor ?? '#e5e7eb';

    return (
        <div className="py-2">
            <hr style={{ borderTopWidth: weight, borderColor: color, borderStyle: 'solid' }} />
        </div>
    );
}

export default DividerBlock;