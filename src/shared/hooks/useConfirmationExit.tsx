import {
    useEffect
} from "react";
import {
    useBlocker
} from "react-router-dom"
import {
    Modal
} from "antd";
import { useToast } from "./useToast";
import { useTranslation } from "react-i18next";
import { AlertCircleIcon } from "lucide-react";

const { confirm } = Modal;

export const useConfirmationExit = (when: boolean) => {
    /** Configurate blocking with the condition */
    const blocker = useBlocker(when);
    /** Toast utilities */
    const { onToast } = useToast();
    /** Translation utilities */
    const { t } = useTranslation();

    useEffect(() => {
        if( blocker.state === 'blocked' ) {
            confirm({
				title: t('titles.changes-detected'),
				icon: <AlertCircleIcon className="text-destructive mr-5 w-15 h-15" />,
				okText: t('buttons.confirm'),
				content: (
                    <span className='font-[Lato-Light] text-[14px]'> { t('messages.confirmation-unsaved-changes') } </span>
				),
				onOk: async () => {
					blocker.proceed();
				},
				onCancel() {
					onToast({ message: t('messages.operation-cancelled'), type: 'info' });
                    blocker.reset();
				},
			});
        }
    }, [blocker]);
    
}