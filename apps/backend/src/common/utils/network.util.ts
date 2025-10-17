import { networkInterfaces } from 'os';
import { LoggingUtil } from './logging.util';

export class NetworkUtil {
  private static cachedIp: string | null = null;

  /**
   * Get the server's local IP address (non-localhost)
   * This is useful for mobile devices to access the server on the local network
   */
  static getLocalIpAddress(): string | null {
    // Return cached IP if available
    if (this.cachedIp) {
      return this.cachedIp;
    }

    try {
      const nets = networkInterfaces();
      const results: string[] = [];

      for (const name of Object.keys(nets)) {
        const netInfo = nets[name];
        if (!netInfo) continue;

        for (const net of netInfo) {
          // Skip over non-IPv4 and internal (i.e., 127.0.0.1) addresses
          const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4;
          if (net.family === familyV4Value && !net.internal) {
            results.push(net.address);
          }
        }
      }

      // Prefer addresses that start with 192.168 (common local network)
      const localAddress = results.find((ip) => ip.startsWith('192.168.')) || results[0];

      if (localAddress) {
        this.cachedIp = localAddress;
        LoggingUtil.log(`Detected local IP address: ${localAddress}`);
      } else {
        LoggingUtil.warn('Could not detect local IP address, using localhost');
      }

      return localAddress || null;
    } catch (error) {
      LoggingUtil.error('Failed to detect local IP address', error);
      return null;
    }
  }

  /**
   * Replace localhost in a URL with the actual server IP
   * This is useful for generating URLs accessible from mobile devices
   */
  static replaceLocalhostWithIp(url: string): string {
    const localIp = this.getLocalIpAddress();
    if (!localIp) {
      return url;
    }

    // Replace localhost and 127.0.0.1 with the actual IP
    return url.replace(/localhost|127\.0\.0\.1/g, localIp);
  }

  /**
   * Check if a URL uses localhost
   */
  static isLocalhostUrl(url: string): boolean {
    return /localhost|127\.0\.0\.1/.test(url);
  }

  /**
   * Clear cached IP address (useful for testing or when network changes)
   */
  static clearCache(): void {
    this.cachedIp = null;
  }
}
