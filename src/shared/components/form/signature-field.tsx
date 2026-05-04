import { useRef, useCallback, useEffect, type ReactElement } from "react";
import { PenTool, Trash2 } from "lucide-react";

/** Signature pad (canvas) */
export const SignatureFieldRenderer = ({ field, disabled }: any): ReactElement => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const isDrawingRef = useRef(false);

	/** Convert a mouse event's client coords to canvas pixel coords, accounting
	 *  for any CSS scaling between the element's rendered size and its intrinsic
	 *  pixel buffer (width/height attributes). */
	const toCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current!;
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		return {
			x: (e.clientX - rect.left) * scaleX,
			y: (e.clientY - rect.top) * scaleY,
		};
	}, []);

	const toCanvasPosTouch = useCallback((touch: React.Touch) => {
		const canvas = canvasRef.current!;
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		return {
			x: (touch.clientX - rect.left) * scaleX,
			y: (touch.clientY - rect.top) * scaleY,
		};
	}, []);

	const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
		if (disabled) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		isDrawingRef.current = true;
		const { x, y } = toCanvasPos(e);
		ctx.beginPath();
		ctx.moveTo(x, y);
	}, [disabled, toCanvasPos]);

	const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!isDrawingRef.current || disabled) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const { x, y } = toCanvasPos(e);
		ctx.lineWidth = 2;
		ctx.lineCap = 'round';
		ctx.strokeStyle = '#1a1a1a';
		ctx.lineTo(x, y);
		ctx.stroke();
	}, [disabled, toCanvasPos]);

	const stopDrawing = useCallback(() => {
		if (!isDrawingRef.current) return;
		isDrawingRef.current = false;
		const canvas = canvasRef.current;
		if (canvas) {
			field.onChange(canvas.toDataURL('image/png'));
		}
	}, [field]);

	const startDrawingTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
		if (disabled) return;
		e.preventDefault();
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		isDrawingRef.current = true;
		const { x, y } = toCanvasPosTouch(e.touches[0]);
		ctx.beginPath();
		ctx.moveTo(x, y);
	}, [disabled, toCanvasPosTouch]);

	const drawTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
		if (!isDrawingRef.current || disabled) return;
		e.preventDefault();
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const { x, y } = toCanvasPosTouch(e.touches[0]);
		ctx.lineWidth = 2;
		ctx.lineCap = 'round';
		ctx.strokeStyle = '#1a1a1a';
		ctx.lineTo(x, y);
		ctx.stroke();
	}, [disabled, toCanvasPosTouch]);

	const clearSignature = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		field.onChange(null);
	};

	// If there's a saved signature, draw it
	useEffect(() => {
		if (field.value && canvasRef.current) {
			const img = new Image();
			img.onload = () => {
				const ctx = canvasRef.current?.getContext('2d');
				if (ctx && canvasRef.current) {
					ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
					ctx.drawImage(img, 0, 0);
				}
			};
			img.src = field.value;
		}
	}, []);

	return (
		<div className="relative">
			<canvas
				ref={canvasRef}
				width={500}
				height={150}
				onMouseDown={startDrawing}
				onMouseMove={draw}
				onMouseUp={stopDrawing}
				onMouseLeave={stopDrawing}
				onTouchStart={startDrawingTouch}
				onTouchMove={drawTouch}
				onTouchEnd={stopDrawing}
				className={`w-full h-36 border-2 border-dashed border-black/10 rounded-xl bg-white ${disabled ? '' : 'cursor-crosshair'}`}
			/>
			{!field.value && !disabled && (
				<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
					<PenTool className="w-5 h-5 text-black/15 mb-1" />
					<span className="text-xs font-[Lato-Regular] text-black/25">Draw your signature</span>
				</div>
			)}
			{field.value && !disabled && (
				<button
					type="button"
					onClick={clearSignature}
					className="absolute top-2 right-2 p-1 rounded-md bg-white/80 text-black/40 hover:text-red-500 transition-colors cursor-pointer"
				>
					<Trash2 className="w-3.5 h-3.5" />
				</button>
			)}
		</div>
	);
};
