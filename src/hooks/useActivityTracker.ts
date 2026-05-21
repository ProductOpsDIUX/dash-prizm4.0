// @ts-nocheck
import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ActivityEvent {
  user_id: string;
  user_role: string;
  event_type: string;
  event_name: string;
  metadata: Record<string, any>;
}

const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

let eventQueue: ActivityEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const flushEvents = async () => {
  if (eventQueue.length === 0) return;
  const batch = [...eventQueue];
  eventQueue = [];

  try {
    await supabase.from('user_activity_logs').insert(batch);
  } catch (e) {
    // Re-add failed events back to queue (best effort)
    eventQueue = [...batch, ...eventQueue];
  }
};

const queueEvent = (event: ActivityEvent) => {
  eventQueue.push(event);
  if (eventQueue.length >= BATCH_SIZE) {
    flushEvents();
  }
  // Reset flush timer
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushEvents, FLUSH_INTERVAL);
};

export const useActivityTracker = () => {
  const location = useLocation();
  const { supabaseUser, activeRole, isSuperAdmin } = useAuth();
  const lastPageRef = useRef<string>('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userId = supabaseUser?.id;

  // Track page views on route change (debounced) — skip superadmins
  useEffect(() => {
    if (!userId || isSuperAdmin) return;
    const path = location.pathname;
    if (path === lastPageRef.current) return;
    lastPageRef.current = path;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      queueEvent({
        user_id: userId,
        user_role: activeRole || 'unknown',
        event_type: 'page_view',
        event_name: path,
        metadata: {},
      });
    }, 500);
  }, [location.pathname, userId, activeRole, isSuperAdmin]);

  // Track login — skip superadmins
  const hasLoggedLoginRef = useRef(false);
  useEffect(() => {
    if (!userId || hasLoggedLoginRef.current || isSuperAdmin) return;
    hasLoggedLoginRef.current = true;
    queueEvent({
      user_id: userId,
      user_role: activeRole || 'unknown',
      event_type: 'login',
      event_name: 'user_login',
      metadata: {},
    });
  }, [userId, isSuperAdmin]);

  // Flush on unmount / page unload
  useEffect(() => {
    const handleUnload = () => flushEvents();
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      flushEvents();
    };
  }, []);

  const trackAction = useCallback(
    (eventName: string, metadata: Record<string, any> = {}) => {
      if (!userId || isSuperAdmin) return;
      queueEvent({
        user_id: userId,
        user_role: activeRole || 'unknown',
        event_type: 'action',
        event_name: eventName,
        metadata,
      });
    },
    [userId, activeRole, isSuperAdmin]
  );

  return { trackAction };
};

// Singleton context for components that can't use the hook directly
let _trackAction: ((name: string, metadata?: Record<string, any>) => void) | null = null;

export const setGlobalTrackAction = (fn: typeof _trackAction) => {
  _trackAction = fn;
};

export const trackActionGlobal = (name: string, metadata: Record<string, any> = {}) => {
  _trackAction?.(name, metadata);
};
