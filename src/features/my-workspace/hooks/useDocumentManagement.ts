import { useState, useRef, useCallback } from "react";
import { useToast } from "../../../shared/hooks/useToast";
import { apiClient } from "../../../server/api-client";

interface UseDocumentManagementOptions {
	instanceId: number | null;
	onInstanceUpdate: () => Promise<void>;
}

export const useDocumentManagement = ({ instanceId, onInstanceUpdate }: UseDocumentManagementOptions) => {
	const { onToast, onConfirmationToast } = useToast();
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<number>(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileUpload = useCallback(async (files: FileList, stepInstanceId: number) => {
		if (files.length === 0) return;
		setUploading(true);
		setUploadProgress(0);
		try {
			const formData = new FormData();
			formData.append('stepInstanceId', String(stepInstanceId));
			for (let i = 0; i < files.length; i++) formData.append('files', files[i]);

			const result = await apiClient.post('/api/documents/upload', formData, {
				onUploadProgress: (loaded, total) => {
					setUploadProgress(total > 0 ? (loaded / total) * 100 : 0);
				},
			});

			if (result.success && instanceId) {
				await onInstanceUpdate();
				onToast({ message: `${files.length} file(s) uploaded successfully`, type: 'success' });
			} else if (!result.success) {
				onToast({ message: result.message || 'Failed to upload files', type: 'error' });
			}
		} catch {
			onToast({ message: 'Failed to upload files', type: 'error' });
		} finally {
			setUploading(false);
			setUploadProgress(0);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	}, [instanceId, onInstanceUpdate, onToast]);

	const handleRenameDocument = useCallback(async (docId: number, newName: string): Promise<boolean> => {
		try {
			const result = await apiClient.patch(`/api/documents/${docId}/rename`, { fileName: newName.trim() });
			if (result.success && instanceId) {
				await onInstanceUpdate();
				onToast({ message: 'File renamed', type: 'success' });
				return true;
			}
			if (!result.success) {
				onToast({ message: result.message || 'Failed to rename file', type: 'error' });
			}
			return false;
		} catch {
			onToast({ message: 'Failed to rename file', type: 'error' });
			return false;
		}
	}, [instanceId, onInstanceUpdate, onToast]);

	const handleDeleteDocument = useCallback(async (docId: number, fileName: string) => {
		const { confirmed } = await onConfirmationToast({
			title: 'Remove document?',
			description: `Are you sure you want to remove "${fileName}"? This action cannot be undone.`,
			actionText: 'Remove', cancelText: 'Cancel', actionColor: 'error'
		});
		if (!confirmed) return;
		try {
			const result = await apiClient.delete(`/api/documents/${docId}`);
			if (result.success && instanceId) {
				await onInstanceUpdate();
				onToast({ message: 'Document removed', type: 'success' });
			} else if (!result.success) {
				onToast({ message: result.message || 'Failed to remove document', type: 'error' });
			}
		} catch {
			onToast({ message: 'Failed to remove document', type: 'error' });
		}
	}, [instanceId, onInstanceUpdate, onToast, onConfirmationToast]);

	return {
		uploading,
		uploadProgress,
		fileInputRef,
		handleFileUpload,
		handleRenameDocument,
		handleDeleteDocument
	};
};
