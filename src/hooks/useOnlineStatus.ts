import { useState, useEffect, useCallback, useRef } from "react";

/** Tracks browser online/offline state and fires a callback when coming back online. */
export const useOnlineStatus = (onReconnect?: () => void) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const wasOffline = useRef(!navigator.onLine);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOffline.current && onReconnect) {
      onReconnect();
    }
    wasOffline.current = false;
  }, [onReconnect]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    wasOffline.current = true;
  }, []);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return isOnline;
};
