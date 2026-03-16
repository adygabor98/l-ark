import {
    type ReactElement,
} from 'react';
import {
    FIELD_GROUPS,
    FIELD_TYPES,
    TemplateComponents
} from '../../../models/template.models';
import {
    getFieldTypeColor
} from '../../../models/field-type-colors';
import {
    Component
} from 'lucide-react';

interface PropTypes {
    addField: (type: TemplateComponents) => void;
}

const ComponentsTemplate = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { addField } = props;

    return (
         <aside className="w-70 border-r border-black/6 bg-white flex flex-col shrink-0 z-10 relative rounded-lg">
            <div className="p-6 border-b border-black/4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-black/4 flex items-center justify-center">
                    <Component className="w-4 h-4 text-black" />
                </div>
                <div>
                    <h2 className="font-[Lato-Bold] text-base tracking-tight"> Components </h2>
                    <p className="text-xs text-black/40 mt-1 font-[Lato-Regular]"> Click to add it. </p>
                </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 no-scrollbar flex flex-col gap-5">
                { FIELD_GROUPS.map(group => {
                    const groupTypes = FIELD_TYPES.filter(t => group.types.includes(t.id));

                    return (
                        <div key={group.label}>
                            <p className="text-[10px] font-[Lato-Bold] text-black/30 uppercase tracking-widest mb-2 px-1">
                                { group.label }
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                { groupTypes.map(type => {
                                    const typeColor = getFieldTypeColor(type.id);

                                    return (
                                        <button key={type.id} onClick={() => addField(type.id)}
                                            className="relative flex flex-col items-center justify-center p-4 gap-3 rounded-2xl border border-black/6 bg-[#FDFDFD] hover:border-black/20 hover:shadow-md transition-all duration-300 text-black/60 hover:text-black group"
                                        >
                                            {/* Color indicator dot */}
                                            <div className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${typeColor.dot} opacity-60 group-hover:opacity-100 transition-opacity`} />

                                            <type.icon className={`w-6 h-6 stroke-[1.5] group-hover:scale-110 transition-transform ${typeColor.text} opacity-70 group-hover:opacity-100`} />
                                            <span className="text-[11px] font-[Lato-Regular] text-center tracking-wide text-black/60 group-hover:text-black/80">
                                                { type.label }
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}

export default ComponentsTemplate;
