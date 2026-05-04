import {
    useEffect,
    useState,
    type ReactElement
} from 'react';
import {
    Clock,
    Loader2,
    Shield,
    Trash2,
    UserPlus,
    X
} from 'lucide-react';
import {
    useToast
} from '../../../shared/hooks/useToast';
import {
    getResponseMessage
} from '../../../server/hooks/useApolloWithToast';
import {
    useDocumentGrants
} from '../../../server/hooks/useDocumentGrants';
import type {
    FetchResult
} from '@apollo/client';
import type {
    ApiResponse
} from '@l-ark/types';
import {
    useForm
} from 'react-hook-form';
import {
    useTranslation
} from 'react-i18next';
import Field from '../../../shared/components/field';
import Button from '../../../shared/components/button';

interface PropTypes {
	docId: number;
	fileName: string;
    
    onClose: () => void;
}

const MyWorkspaceGrantAccess = (props: PropTypes): ReactElement => {
    /** Retrieve component properties */
    const { docId, fileName, onClose } = props;
    /** Toast utilities */
    const { onToast } = useToast();
    /** Document access grant api utilities */
    const { grants, retrieveGrantsBydocumentId, grantDocumentAccess, revokeDocumentAccess } = useDocumentGrants();
    /** Formulary definition */
    const { control, handleSubmit, reset, watch } = useForm({
        mode: 'onChange',
        defaultValues: {
            selectedUserId: null,
            expiryHours: '24'
        }
    });
    /** Watched values */
    const userSelected = watch('selectedUserId');
    /** Translation utilities */
    const { t } = useTranslation();
    const [loading, _] = useState<boolean>(false);
    const [granting, setGranting] = useState<boolean>(false);

    useEffect(() => {
        retrieveGrantsBydocumentId({ documentId: docId });
    }, []);

    /** Manage to grant access to the current document */
    const handleGrant = async (data: any): Promise<void> => {
        if ( !data.selectedUserId ) return;
        setGranting(true);
        let expiresAt: string | null = null;
        if ( data.expiryHours ) {
            const d = new Date();
            d.setHours(d.getHours() + parseInt(data.expiryHours));
            expiresAt = d.toISOString();
        }

        try {
            const response: FetchResult<{ data: ApiResponse }> = await grantDocumentAccess({ documentId: docId, grantedToId: data.selectedUserId, expiresAt });

            onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
            setGranting(false);
            reset({ selectedUserId: null, expiryHours: '24' });
        } catch ( e: any ) {
            console.error(e);
            setGranting(false);
        }
    };

    /** Manage to revoke access to the current document */
    const handleRevoke = async (grantId: number): Promise<void> => {
        setGranting(true);
        try {
            const response: FetchResult<{ data: ApiResponse }> = await revokeDocumentAccess({ grantId });
            onToast({ message: getResponseMessage(response.data?.data), type: response.data?.data.success ? 'success' : 'error' });
            setGranting(false);
        } catch (e: any) {
            console.error(e);
            setGranting(false);
        }
    };


    /** Manage to render the header of the dialog */
    const renderHeader = (): ReactElement => (
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                    <h2 className="text-md font-[Lato-Bold] text-black/80"> Document Access </h2>
                    <p className="text-[11px] font-[Lato-Regular] text-black/40 truncate max-w-75"> { fileName } </p>
                </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-black/30 hover:bg-black/4 hover:text-black/60 transition-all cursor-pointer">
                <X className="w-4 h-4" />
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

			<div className="relative bg-white rounded-2xl shadow-2xl w-150 max-w-lg overflow-hidden animate-in zoom-in-95 fade-in duration-300">
				{ renderHeader() }

				<div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
					{ loading ?
						<div className="flex flex-col items-center gap-3 py-8">
							<Loader2 className="w-6 h-6 animate-spin text-violet-500" />
							<p className="text-sm font-[Lato-Regular] text-black/40"> Loading... </p>
						</div>
					:
						<>
							<div className="mb-6">
								<h3 className="text-xs font-[Lato-Bold] text-black/50 uppercase tracking-wider mb-3"> Grant Access </h3>
								<div className="flex items-center gap-2">
                                    <Field control={control} name='selectedUserId' label={ t('labels.user') } type='select' dataType="users" placeholder={t(`placeholders.select-field`)} required />
                                    <Field control={control} name='expiryHours' label={ t('labels.expiry')} type='select' dataType="expiry-hours" placeholder={t(`placeholders.select-field`)} required />

	
									<Button variant="primary" size="sm" className='h-10' onClick={handleSubmit(handleGrant)} disabled={!userSelected || granting}>
										{ granting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" /> }
										Grant
									</Button>
								</div>
							</div>

                            { grants.length !== 0 &&
							    <div>
								    <h3 className="text-xs font-[Lato-Bold] text-black/50 uppercase tracking-wider mb-3">
									    Active Grants ({ grants.length })
								    </h3>
									<div className="space-y-2">
										{ grants.map(grant => (
											<div key={grant.id} className="flex items-center justify-between p-3 rounded-xl border border-black/6 bg-[#F8F9FA]">
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<span className="text-sm font-[Lato-Bold] text-black/70">
															{ grant.grantedTo.firstName } { grant.grantedTo.lastName }
														</span>
                                                    </div>
													<div className="flex items-center gap-3 mt-1">
														<span className="text-[10px] font-[Lato-Regular] text-black/30">
															Granted by { grant.grantedBy.firstName } { grant.grantedBy.lastName }
														</span>
														{ grant.expiresAt &&
															<span className="flex items-center gap-1 text-[10px] font-[Lato-Regular] text-amber-600">
																<Clock className="w-2.5 h-2.5" />
																Expires { new Date(grant.expiresAt).toLocaleDateString() }
															</span>
														}
													</div>
												</div>
												<button onClick={() => handleRevoke(grant.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-black/30 hover:text-red-500 transition-all cursor-pointer">
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
										))}
									</div>
							    </div>
                            }
						</>
					}
				</div>

				<div className="px-6 py-3 border-t border-black/6 bg-[#F8F9FA]">
					<Button variant="ghost" onClick={onClose} className="w-full">
						Close
					</Button>
				</div>
			</div>
		</div>
    );
}

export default MyWorkspaceGrantAccess;
