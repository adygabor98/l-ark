import { useState, useRef, useCallback } from "react";
import { useToast } from "../../../shared/hooks/useToast";

interface UseDocumentManagementOptions {
	instanceId: number | null;
	onInstanceUpdate: () => Promise<void>;
}

export const useDocumentManagement = ({ instanceId, onInstanceUpdate }: UseDocumentManagementOptions) => {
	const { onToast, onConfirmationToast } = useToast();
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileUpload = useCallback(async (files: FileList, stepInstanceId: number) => {
		if (files.length == 0) return;
		setUploading(true);
		try {
			const formData = new FormData();
			formData.append('stepInstanceId', String(stepInstanceId));
			for (let i = 0; i < files.length; i++) formData.append('files', files[i]);
			const res = await fetch(`${import.meta.env.VITE_SERVER_HOST}/api/documents/upload`, { method: 'POST', body: formData });
			const result = await res.json();
			if (result.success && instanceId) {
				await onInstanceUpdate();
				onToast({ message: `${files.length} file(s) uploaded successfully`, type: 'success' });
			}
		} catch {
			onToast({ message: 'Failed to upload files', type: 'error' });
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	}, [instanceId, onInstanceUpdate]);

	const handleRenameDocument = useCallback(async (docId: number, newName: string): Promise<boolean> => {
		try {
			const res = await fetch(`${import.meta.env.VITE_SERVER_HOST}/api/documents/${docId}/rename`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ fileName: newName.trim() }),
			});
			const result = await res.json();
			if (result.success && instanceId) {
				await onInstanceUpdate();
				onToast({ message: 'File renamed', type: 'success' });
				return true;
			}
			return false;
		} catch {
			onToast({ message: 'Failed to rename file', type: 'error' });
			return false;
		}
	}, [instanceId, onInstanceUpdate]);

	const handleDeleteDocument = useCallback(async (docId: number, fileName: string) => {
		const { confirmed } = await onConfirmationToast({
			title: 'Remove document?',
			description: `Are you sure you want to remove "${fileName}"? This action cannot be undone.`,
			actionText: 'Remove', cancelText: 'Cancel', actionColor: 'error'
		});
		if (!confirmed) return;
		try {
			const res = await fetch(`${import.meta.env.VITE_SERVER_HOST}/api/documents/${docId}`, { method: 'DELETE' });
			const result = await res.json();
			if (result.success && instanceId) {
				await onInstanceUpdate();
				onToast({ message: 'Document removed', type: 'success' });
			}
		} catch {
			onToast({ message: 'Failed to remove document', type: 'error' });
		}
	}, [instanceId, onInstanceUpdate]);

	return {
		uploading,
		fileInputRef,
		handleFileUpload,
		handleRenameDocument,
		handleDeleteDocument
	};
};
