import {
    getTokenExpirationTime,
    isTokenExpired,
    removeAccessToken,
    refreshAccessToken
} from '../helpers/auth';

type LogoutCallback = () => void;

class TokenExpirationMonitor {
    private timerId: number | null = null;
    private logoutCallback: LogoutCallback | null = null;
    private checkIntervalMs: number = 60000; // Check every 1 minute by default
    private isRefreshing: boolean = false; // Prevent multiple simultaneous refresh attempts

    /**
     * Start monitoring token expiration
     * @param onExpired - callback function to execute when token refresh fails and user needs to logout
     * @param checkInterval - how often to check token expiration in milliseconds (default: 60000ms = 1 minute)
     */
    start(onExpired: LogoutCallback, checkInterval: number = 60000): void {
        this.logoutCallback = onExpired;
        this.checkIntervalMs = checkInterval;

        // Clear any existing timer
        this.stop();

        // Check immediately on start
        this.checkTokenExpiration();

        // Set up periodic check
        this.timerId = window.setInterval(() => {
            this.checkTokenExpiration();
        }, this.checkIntervalMs);

        console.log('Token expiration monitor started');
    }

    /**
     * Stop monitoring token expiration
     */
    stop(): void {
        if (this.timerId) {
            window.clearInterval(this.timerId);
            this.timerId = null;
            console.log('Token expiration monitor stopped');
        }
    }

    /**
     * Check if token is expired and attempt to refresh, or logout if refresh fails
     */
    private async checkTokenExpiration(): Promise<void> {
        // Check if token is expired or will expire within 5 minutes
        if (isTokenExpired(300)) { // 5 minutes = 300 seconds
            console.log('Token expired or expiring soon, attempting to refresh...');
            await this.handleExpiredToken();
        } else {
            const remainingTime = getTokenExpirationTime();
            const remainingMinutes = Math.floor(remainingTime / 60000);
            console.log(`Token is valid. Remaining time: ${remainingMinutes} minutes`);
        }
    }

    /**
     * Handle expired token by attempting to refresh, or logout if refresh fails
     */
    private async handleExpiredToken(): Promise<void> {
        // Prevent multiple simultaneous refresh attempts
        if (this.isRefreshing) {
            console.log('Token refresh already in progress, skipping...');
            return;
        }

        this.isRefreshing = true;

        try {
            console.log('Attempting to refresh access token...');
            const newToken = await refreshAccessToken();

            if (newToken) {
                console.log('Token refreshed successfully');
                this.isRefreshing = false;
                // Token was refreshed, continue monitoring
                return;
            }

            // If we get here, refresh failed
            throw new Error('Token refresh returned null');
        } catch (error) {
            console.error('Token refresh failed, logging out user:', error);
            this.isRefreshing = false;
            this.stop(); // Stop monitoring
            removeAccessToken(); // Clear token

            if (this.logoutCallback) {
                this.logoutCallback();
            }
        }
    }

    /**
     * Manually trigger token expiration check
     */
    checkNow(): void {
        this.checkTokenExpiration();
    }
}

// Export singleton instance
export const tokenExpirationMonitor = new TokenExpirationMonitor();
