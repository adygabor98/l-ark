import {
	useEffect,
	useState
} from "react";
import $ from 'jquery';

export const inViewport = ($el: any): number => {
	if( $el.length > 0 ) {
		const elH = $el.outerHeight();
		const H = $(window).height();
		const r = $el[0].getBoundingClientRect();
		const t= r.top;
		const  b= r.bottom;
		
		return Math.max(0, t>0? Math.min(elH, (H ?? 0) - t) : Math.min(b, H ?? 0));
	}

	return 0;
}

export const useResize = (id: string) => {
	/**
	 * State to manage the height of element with id given as parameter
	 */
	const [height, setHeight] = useState<number>(200);

	/**
	 * @description we analyze the dimensions on the window when it is resized
	 */
	useEffect(() => {
		const handleResize = () => {
			setHeight(inViewport($(`#${id}`)));
		}

		window.addEventListener("resize", handleResize);

		handleResize();

		return () => window.removeEventListener("resize", handleResize);
	}, []); 
	
	return height;
}


export const useResizeWidth = (id: string) => {
	/**
	 * State to manage the height of element with id given as parameter
	 */
	const [width, setWidth] = useState<number>(window.innerWidth);

	/**
	 * @description we analyze the dimensions on the window when it is resized
	 */
	useEffect(() => {
		setTimeout(() => {
            const myDiv = document.getElementById(id);
            // Get the width of the div
            setWidth(myDiv?.offsetWidth ?? 400);

            const resizeObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                  const width = entry.contentRect.width; // Agafa la width actual de l'element
                  setWidth(width ?? 400);
                }
              });
              
              // Comença a observar l'element
              resizeObserver.observe(myDiv as any);
        }, 500);

	}, []); 
	
	return width;
}