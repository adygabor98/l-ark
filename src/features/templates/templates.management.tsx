import {
    useEffect,
    type ReactElement
} from "react";
import { 
    Plus, 
    MoreHorizontal,
    FileEdit,
    Eye,
    Copy,
    Archive,
    Clock,
  FileText,
  Info
} from "lucide-react";
import {
    useNavigate
} from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "../../shared/components/dropdown-button";
import {
    useFileTemplate
} from "../../server/hooks/useFileTemplate";
import {
    FileTemplateStatus,
    FileTemplateVersionStatus,
    type FileTemplateSummary
} from "@l-ark/types";
import {
    format
} from "date-fns";
import Button from "../../shared/components/button";
import { Badge } from "../../shared/components/badge";
import { useTranslation } from "react-i18next";

const TemplateManagement = (): ReactElement => {
    /** Navigation utilities */
    const navigate = useNavigate();
    /** File template utilities */
    const { fileTemplates, retrieveFileTemplates } = useFileTemplate();
    const { t } = useTranslation();

    useEffect(() => {
        retrieveFileTemplates();
    }, []);
    
    /** Retreve the status color depending on the status of the template */
    const getStatusColor = (status: string) => {
        switch (status) {
            case FileTemplateStatus.ACTIVE: return "text-emerald-700";
            case FileTemplateStatus.DRAFT: return "text-amber-600";
            case FileTemplateStatus.ARCHIVED: return "text-slate-500";
            default: return "text-slate-500";
        }
    };

    const goToDetail = (id: number | null = null) => {
        navigate("/templates/builder", { state: { id: id } });
    }

    const getLastPublishedVersion = (fileTemplate: FileTemplateSummary) => fileTemplate.versions.find(fileTemplateVersion => fileTemplateVersion.status === FileTemplateVersionStatus.PUBLISHED);
    
    const getDraftVersion = (fileTemplate: FileTemplateSummary) => fileTemplate.versions.find(fileTemplateVersion => fileTemplateVersion.status === FileTemplateVersionStatus.DRAFT);

    /** Manage to sort the templates by ids */
    const getFileTemplatesSorted = (): FileTemplateSummary[] => [...fileTemplates].sort((a: FileTemplateSummary, b: FileTemplateSummary) => a.id - b.id);

    
    return (
        <div className="h-[calc(100%-140px)]">
            <div className="mt-5 sticky top-0 z-10">
                <div className="flex justify-between items-end">
                    <div className="max-w-xl">
                        <h1 className="text-4xl font-[Lato-Black] tracking-tight text-black mb-3"> { t('templates.title') } </h1>
                        <p className="text-md text-black/50 font-[Lato-Regular] leading-relaxed"> { t('templates.subtitle') } </p>
                    </div>
                    <Button variant="primary" onClick={() => goToDetail()}>
                        <Plus className="w-5 h-5" />
                        { t('templates.new-template') }
                    </Button>
                </div>
            </div>

            <div className="h-full flex-1 overflow-y-auto relative mt-10">
                <div className="absolute top-0 left-0 w-full h-64 pointer-events-none"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pr-2">
                    { getFileTemplatesSorted().map((template: FileTemplateSummary) => (
                        <div key={template.id} onClick={() => goToDetail(template.id)}
                            className="group relative rounded-4xl transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 flex flex-col cursor-pointer"
                        >
                            
                            <div className="bg-white rounded-[1.75rem] p-7 flex-1 flex flex-col relative z-10 border border-black/2 overflow-hidden">
                                <div className="absolute -right-6 -top-6 opacity-60 pointer-events-none group-hover:opacity-100 transition-all duration-500 z-0">
                                    <FileText className="w-48 h-48 text-black/3 -rotate-12 transform group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500" strokeWidth={1} />
                                </div>
                                
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <div className='px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide flex items-center gap-2 bg-amber-50 text-amber-700 ring-1 ring-amber-700/20'>
                                        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                        { template.divisions.map((division) =>  division.division?.name ) }
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="flex items-center justify-center h-8 w-8 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-all duration-300 rounded-full bg-white shadow-sm border border-black/4">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 rounded-2xl border-black/5 shadow-xl p-2 bg-white/95 backdrop-blur-xl">
                                                <DropdownMenuItem className="rounded-xl cursor-pointer p-3 transition-colors hover:bg-black/2">
                                                    <FileEdit className="mr-3 h-4 w-4 text-black/40" /> <span className="font-[Lato-Regular] text-black/80">{ t('templates.edit-template') }</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl cursor-pointer p-3 transition-colors hover:bg-black/2">
                                                    <Eye className="mr-3 h-4 w-4 text-black/40" /> <span className="font-[Lato-Regular] text-black/80">{ t('templates.preview') }</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl cursor-pointer p-3 transition-colors hover:bg-black/2">
                                                    <Copy className="mr-3 h-4 w-4 text-black/40" /> <span className="font-[Lato-Regular] text-black/80">{ t('templates.duplicate') }</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-black/2 my-2" />
                                                <DropdownMenuItem className="rounded-xl cursor-pointer p-3 text-red-600 focus:text-red-600 focus:bg-red-50 transition-colors">
                                                    <Archive className="mr-3 h-4 w-4" /> <span className="font-[Lato-Regular]">{ t('templates.archive') }</span>
                                                </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            
                                <h3 className="text-2xl font-[Lato-Bold] tracking-tight text-black mb-3 line-clamp-2 leading-snug group-hover:text-black/80 transition-colors">
                                    { template.title }
                                </h3>
                                
                                <p className="text-sm text-black/40 font-[Lato-Regular] mb-2 line-clamp-2 leading-relaxed">
                                    Used for { /*template.operations.join(", ")*/ '' } processes.
                                </p>

                                { getDraftVersion(template) && 
                                    <Badge variant='secondary' className="flex items-center gap-3">
                                        <Info className="w-4 h-4" />
                                        <span> Draft version v{ getDraftVersion(template)?.versionNumber }.0 in progress</span>
                                    </Badge>
                                }
                                
                                <div className="mt-auto flex items-center justify-between pt-6 border-t border-black/4">
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center justify-center w-4 h-4 rounded-full ${template.status === FileTemplateStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' : template.status === FileTemplateStatus.DRAFT ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                                            <div className="w-2 h-2 rounded-full bg-current" />
                                        </div>
                                        <span className={`text-[11px] font-[Lato-Bold] uppercase ${getStatusColor(template.status)}`}>
                                            { template.status }
                                        </span>
                                        <span className="text-black/20 text-[10px]">•</span>
                                        <span className="text-[11px] font-[Lato-Bold] text-black/40 uppercase">
                                            v{ getLastPublishedVersion(template)?.versionNumber }.0
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center text-xs font-[Lato-Regular] text-black/30 gap-1.5">
                                        <Clock className="w-3.5 h-3.5 opacity-60" />
                                        { format(template.updatedAt ?? new Date, 'dd-MM-yyyy') }
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State placeholder if list is empty */}
                    {  fileTemplates.length === 0 &&
                        <div className="col-span-full py-32 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-black/6 border-dashed">
                            <div className="w-20 h-20 bg-black/3 rounded-2xl flex items-center justify-center mb-6">
                                <FileEdit className="w-10 h-10 text-black/30" />
                            </div>
                            <h3 className="text-2xl font-[Lato-Black] text-black mb-2">{ t('templates.no-templates') }</h3>
                            <p className="text-md text-black/50 mb-8 max-w-md font-[Lato-Regular]">
                                { t('templates.no-templates-description') }
                            </p>
                            <Button variant="primary" onClick={() => goToDetail()}>
                                { t('templates.create-first') }
                            </Button>
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}

export default TemplateManagement;