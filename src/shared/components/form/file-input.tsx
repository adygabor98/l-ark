import {
    Image,
    Upload
} from "antd";
import {
    UploadOutlined,
    DeleteOutlined
} from '@ant-design/icons' ;
import {
    useTranslation
} from "react-i18next";
import imageCompression from 'browser-image-compression';

interface PropTypes {
    field: any;
}

export const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

export const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';

    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) u8arr[n] = bstr.charCodeAt(n);

    return new File([u8arr], filename, { type: mime });
}

const FileInput = (props: PropTypes) => {
    /** Retrieve component properties */
    const { field } = props;
    /** Translation utilities */
    const { t } = useTranslation();

    return (
        <div className='flex flex-col gap-5 items-center'>
            <Image
                src={field.value.includes('base64,') ? field.value : `${import.meta.env.VITE_IMAGE_HOST}/images${field.value}?width=100&height=100`}
                alt="Uploaded"
                width={'100%'}
                height={'100%'}
                style={{ objectFit: 'cover', borderRadius: 8 }}
                preview={false}
            />
            <div className='flex items-center gap-5' style={{ height: 100 }}>
                <Upload
                    style={{ height: 100, objectFit: 'contain'}}
                    beforeUpload={async (file) => {
                        try {
                            // Compress the file
                            const compressedFile = await imageCompression(file, {
                                maxSizeMB: 5, // adjust as needed
                                maxWidthOrHeight: 1024,
                                useWebWorker: true,
                            });
                      
                            // Convert to base64 after compression
                            const base64 = await getBase64(compressedFile);
                      
                            // Send to form field or state
                            field.onChange(base64);
                      
                        } catch (error) {
                            console.error('Image compression failed:', error);
                        }
                      
                          return false;
                    }}
                    showUploadList={false}
                >
                    <button className="flex gap-2 items-center bg-secondary hover:bg-primary-800 text-tertiary px-4 py-2 text-[12px] rounded-md cursor-pointer">
                        <UploadOutlined />
                        { t('buttons.upload') }
                    </button>
                </Upload>
                <button onClick={() => field.onChange('')} className="flex gap-2 items-center bg-secondary hover:bg-primary-800 text-tertiary px-4 py-2 text-[12px] rounded-md cursor-pointer">
                    <DeleteOutlined />
                    { t('buttons.remove') }
                </button>
            </div>
        </div>
    )
}

export default FileInput;