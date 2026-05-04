
export let gNavigation: any = null;

export const setNavigate = (navigate: any) => {
    gNavigation = navigate;
};

export const navigateTo = (path: string, params?: any) => {
    if (gNavigation) {
        gNavigation(path, params);
    } else {
        console.error('Navigate function is not defined, redirecting via window.location');
        // Fallback to window.location if navigation is not initialized
        window.location.href = path;
    }
};
