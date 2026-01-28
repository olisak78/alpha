/**
 * Session Manager
 * 
 * Tracks session metadata including start time, user info, and duration.
 * Used for analytics tracking of session lifecycle events.
 */

import { User } from '@/types/developer-portal';

interface SessionMetadata {
  startTime: number;  // Unix timestamp in milliseconds
  userId?: string;
  userName?: string;
  email?: string;
  organization?: string;
}

class SessionManager {
  private static readonly STORAGE_KEY = 'session-metadata';

  /**
   * Start tracking a new session
   * Called after successful login
   */
  public startSession(user: User): void {
    const metadata: SessionMetadata = {
      startTime: Date.now(),
      userId: user.id,
      userName: user.name,
      email: user.email,
      organization: user.organization || undefined,
    };

    try {
      sessionStorage.setItem(SessionManager.STORAGE_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to store session metadata:', error);
    }
  }

  /**
   * Get current session metadata
   */
  public getSessionMetadata(): SessionMetadata | null {
    try {
      const data = sessionStorage.getItem(SessionManager.STORAGE_KEY);
      if (!data) return null;
      
      return JSON.parse(data) as SessionMetadata;
    } catch (error) {
      console.error('Failed to retrieve session metadata:', error);
      return null;
    }
  }

  /**
   * Calculate session duration in seconds
   */
  public getSessionDuration(): number | null {
    const metadata = this.getSessionMetadata();
    if (!metadata) return null;

    const durationMs = Date.now() - metadata.startTime;
    return Math.floor(durationMs / 1000); // Convert to seconds
  }

  /**
   * Get user information from current session
   */
  public getUserInfo(): Pick<SessionMetadata, 'userId' | 'userName' | 'email' | 'organization'> | null {
    const metadata = this.getSessionMetadata();
    if (!metadata) return null;

    return {
      userId: metadata.userId,
      userName: metadata.userName,
      email: metadata.email,
      organization: metadata.organization,
    };
  }

  /**
   * Clear session metadata
   * Called on logout or session expiry
   */
  public clearSession(): void {
    try {
      sessionStorage.removeItem(SessionManager.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear session metadata:', error);
    }
  }

  /**
   * Check if there's an active session being tracked
   */
  public hasActiveSession(): boolean {
    return this.getSessionMetadata() !== null;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();