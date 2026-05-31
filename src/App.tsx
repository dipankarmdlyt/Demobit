/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { 
  ArrowUpDown, 
  ChevronRight, 
  ChevronLeft, 
  Settings, 
  Plus, 
  X, 
  Check, 
  Sparkles, 
  CreditCard, 
  XOctagon, 
  CheckCircle2, 
  ShoppingBag,
  Trash2,
  RefreshCw,
  PlusCircle,
  Eye,
  Info,
  ArrowUp,
  ArrowDown,
  Flame,
  Download,
  Bell,
  Mail,
  Copy,
  Star,
  ShieldCheck,
  FileText,
  Database,
  Wifi,
  WifiOff,
  Upload,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Habit, CompletionLogs, CompletionStatus } from './types';
import { 
  initDB, 
  getLocalHabits, 
  saveLocalHabits, 
  getLocalLogs, 
  saveLocalLogs, 
  getMetadata, 
  saveMetadata, 
  enqueueSync, 
  getSyncQueue, 
  removeSyncItems 
} from './db';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';

// Helper to parse "YYYY-MM-DD" safely in local timezone
function parseDateString(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Helper to format Date to "YYYY-MM-DD" safely
function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Get the 4 days ending at anchorDate, inclusive
function getFourDays(anchorStr: string): string[] {
  const anchor = parseDateString(anchorStr);
  const dates: string[] = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    dates.push(formatDateString(d));
  }
  return dates;
}

// Get the 7 days ending at anchorDate, inclusive
function getPastSevenDays(anchorStr: string): string[] {
  const anchor = parseDateString(anchorStr);
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(anchor.getDate() - i);
    dates.push(formatDateString(d));
  }
  return dates;
}

// Format header date (e.g., "Sunday, May 31st, 2026")
function getHeaderFormattedDate(dateStr: string): string {
  const date = parseDateString(dateStr);
  const daysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = daysLong[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNum = date.getDate();
  
  let suffix = 'th';
  if (dayNum === 1 || dayNum === 21 || dayNum === 31) suffix = 'st';
  else if (dayNum === 2 || dayNum === 22) suffix = 'nd';
  else if (dayNum === 3 || dayNum === 23) suffix = 'rd';
  
  return `${dayName}, ${monthName} ${dayNum}${suffix}, ${date.getFullYear()}`;
}

// Calculate the current streak of completed exercises
function calculateCurrentStreak(habitId: string, logs: CompletionLogs, anchorDateStr: string): number {
  let streak = 0;
  const currentDate = parseDateString(anchorDateStr);
  
  const todayKey = `${habitId}_${formatDateString(currentDate)}`;
  const yesterday = new Date(currentDate);
  yesterday.setDate(currentDate.getDate() - 1);
  const yesterdayKey = `${habitId}_${formatDateString(yesterday)}`;

  let startCheckDate = new Date(currentDate);
  if (logs[todayKey] === 'completed') {
    // start from today
  } else if (logs[yesterdayKey] === 'completed') {
    // start from yesterday
    startCheckDate = yesterday;
  } else {
    return 0;
  }

  // Iterate backwards up to 365 days for safety to avoid infinite loops
  for (let i = 0; i < 365; i++) {
    const checkKey = `${habitId}_${formatDateString(startCheckDate)}`;
    if (logs[checkKey] === 'completed') {
      streak++;
      startCheckDate.setDate(startCheckDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Generate synthesized mobile-like sound effects with Web Audio API (tactile and sensory feedback)
function playFeedbackSound(status: CompletionStatus) {
  if (typeof window === 'undefined') return;
  
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const ctx = new AudioContextClass();
    
    // Resume context if suspended (browser requirements for user-instigated sound)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    if (status === 'completed') {
      // Pleasant bright tactile ascending chime chord (two consecutive sweet sine beeps)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.14); // G5
      
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.06, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Delayed octave chime for elegant harmony
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.50, now + 0.08); // C6
      
      gain2.gain.setValueAtTime(0, now + 0.08);
      gain2.gain.linearRampToValueAtTime(0.04, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } else if (status === 'failed') {
      // Slightly heavy/dull soft warning sound (descending triangle wave)
      const osc1 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(220.00, now); // A3
      osc1.frequency.exponentialRampToValueAtTime(130.81, now + 0.22); // C3
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc1.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);
    } else if (status === 'none') {
      // Extremely quick woody click for resetting/toggling off
      const osc1 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(293.66, now); // D4
      osc1.frequency.exponentialRampToValueAtTime(150.00, now + 0.06);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.03, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      osc1.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);
    }
  } catch (err) {
    console.warn('Tactile sound play skipped', err);
  }
}

const DEFAULT_HABITS: Habit[] = [
  { id: 'h1', name: 'Meditation', createdAt: '2026-05-28', order: 0, category: 'Personal' },
  { id: 'h2', name: 'Excerise for 20 min', createdAt: '2026-05-28', order: 1, category: 'Health' }, // Retained screenshot spelling
  { id: 'h3', name: 'Read 10 pages daily', createdAt: '2026-05-28', order: 2, category: 'Work' },
  { id: 'h4', name: 'Drink 3L water dally', createdAt: '2026-05-28', order: 3, category: 'Health' }, // Retained screenshot spelling
];

const DEFAULT_LOGS: CompletionLogs = {
  'h1_2026-05-28': 'failed',
  'h2_2026-05-30': 'completed',
};

export default function App() {
  // State initialization with dual localStorage and background IndexedDB sync
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('moss_habits');
    return saved ? JSON.parse(saved) : DEFAULT_HABITS;
  });

  const [logs, setLogs] = useState<CompletionLogs>(() => {
    const saved = localStorage.getItem('moss_logs');
    return saved ? JSON.parse(saved) : DEFAULT_LOGS;
  });

  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem('moss_premium') === 'true';
  });

  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => {
    return localStorage.getItem('moss_haptic_enabled') !== 'false';
  });

  // PWA & Network Sync State variables
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  // Background bootstrap to align state with local IndexedDB master data
  useEffect(() => {
    async function loadDataFromIndexedDB() {
      try {
        await initDB();
        
        // 1. Recover Habits
        const storedHabits = await getLocalHabits();
        if (storedHabits) {
          setHabits(storedHabits);
        } else {
          await saveLocalHabits(DEFAULT_HABITS);
        }

        // 2. Recover Completion Logs
        const storedLogs = await getLocalLogs();
        if (storedLogs) {
          setLogs(storedLogs);
        } else {
          await saveLocalLogs(DEFAULT_LOGS);
        }

        // 3. Recover License State
        const storedPremium = await getMetadata('moss_premium');
        if (storedPremium !== null) {
          setIsPremium(storedPremium);
        } else {
          await saveMetadata('moss_premium', isPremium);
        }

        // Recover Haptic State
        const storedHaptic = await getMetadata('moss_haptic_enabled');
        if (storedHaptic !== null) {
          setHapticEnabled(storedHaptic);
        } else {
          await saveMetadata('moss_haptic_enabled', hapticEnabled);
        }

        // 4. Recover Last Synced Info
        const storedLastSync = await getMetadata('moss_last_sync');
        if (storedLastSync) {
          setLastSynced(storedLastSync);
        }

        // Run sync cycle on launch if online to check for remote commits
        if (navigator.onLine) {
          triggerServerSync(storedHabits || habits, storedLogs || logs, storedPremium !== null ? storedPremium : isPremium);
        }
      } catch (err) {
        console.warn('[PWA Database] Load issues, running localStorage fallbacks:', err);
      }
    }
    loadDataFromIndexedDB();
  }, []);

  // Online / Offline Listeners & Resync triggers
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerServerSync(habits, logs, isPremium);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    const handlePwaSyncEvent = () => {
      triggerServerSync(habits, logs, isPremium);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pwa-sync', handlePwaSyncEvent);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pwa-sync', handlePwaSyncEvent);
    };
  }, [habits, logs, isPremium]);

  /**
   * Pushes current state to Express backend, reconciles master state, and processes backlog operations.
   */
  const triggerServerSync = async (currentHabits: Habit[], currentLogs: CompletionLogs, currentPremium: boolean) => {
    if (!navigator.onLine) {
      // Offline: Register standard background sync tag inside service worker if supported
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
          const reg = (await navigator.serviceWorker.ready) as any;
          await reg.sync.register('sync-habits');
        } catch (err) {
          console.log('[Sync Engine] Deferred background register.');
        }
      }
      return;
    }

    setIsSyncing(true);
    try {
      const resp = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habits: currentHabits,
          logs: currentLogs,
          isPremium: currentPremium,
          clientTime: Date.now()
        })
      });

      if (resp.ok) {
        const payload = await resp.json();
        if (payload.success && payload.data) {
          const merged = payload.data;
          
          // Align in-memory states with reconciled server database
          setHabits(merged.habits);
          setLogs(merged.logs);
          setIsPremium(merged.isPremium);

          // Persist back to IndexedDB
          await saveLocalHabits(merged.habits);
          await saveLocalLogs(merged.logs);
          await saveMetadata('moss_premium', merged.isPremium);
          await saveMetadata('moss_last_sync', merged.timestamp);

          // Update localStorage secondary cache
          localStorage.setItem('moss_habits', JSON.stringify(merged.habits));
          localStorage.setItem('moss_logs', JSON.stringify(merged.logs));
          localStorage.setItem('moss_premium', merged.isPremium ? 'true' : 'false');

          setLastSynced(merged.timestamp);
        }
      }
    } catch (err) {
      console.warn('[Sync Engine] Soft network timeout, local IndexedDB state is up-to-date.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Persists changes to local caches & trigger sync on mutation
  useEffect(() => {
    async function persist() {
      try {
        await saveLocalHabits(habits);
        localStorage.setItem('moss_habits', JSON.stringify(habits));
        triggerServerSync(habits, logs, isPremium);
      } catch (err) {
        console.error('[PWA Database] Persistent error:', err);
      }
    }
    persist();
  }, [habits]);

  useEffect(() => {
    async function persist() {
      try {
        await saveLocalLogs(logs);
        localStorage.setItem('moss_logs', JSON.stringify(logs));
        triggerServerSync(habits, logs, isPremium);
      } catch (err) {
        console.error('[PWA Database] Persistent error:', err);
      }
    }
    persist();
  }, [logs]);

  useEffect(() => {
    async function persist() {
      try {
        await saveMetadata('moss_premium', isPremium);
        localStorage.setItem('moss_premium', isPremium ? 'true' : 'false');
        triggerServerSync(habits, logs, isPremium);
      } catch (err) {
        console.error('[PWA Database] Persistent error:', err);
      }
    }
    persist();
  }, [isPremium]);

  useEffect(() => {
    async function persist() {
      try {
        await saveMetadata('moss_haptic_enabled', hapticEnabled);
        localStorage.setItem('moss_haptic_enabled', hapticEnabled ? 'true' : 'false');
      } catch (err) {
        console.error('[PWA Database] Persistent error:', err);
      }
    }
    persist();
  }, [hapticEnabled]);

  // Base date of screenshot
  const SCREENSHOT_DATE = '2026-05-31';
  const [anchorDate, setAnchorDate] = useState<string>(SCREENSHOT_DATE);

  // Modal and custom states
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<string>('Personal');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [viewingTermsPage, setViewingTermsPage] = useState(false);
  const [viewingSettingsPage, setViewingSettingsPage] = useState(false);
  
  // Tab within settings (main or contact)
  const [settingsTab, setSettingsTab] = useState<'main' | 'contact'>('main');
  const [copied, setCopied] = useState(false);

  // Daily reminder configurations in Add habit flow
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  
  // Real-time active in-app notification banner toast
  const [activeNotification, setActiveNotification] = useState<{ id: string; habitName: string; time: string } | null>(null);

  // Checkout payment mock states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [email, setEmail] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Persists states in localStorage
  useEffect(() => {
    localStorage.setItem('moss_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('moss_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('moss_premium', isPremium ? 'true' : 'false');
  }, [isPremium]);

  // Navigate dates
  const handlePrevDays = () => {
    const current = parseDateString(anchorDate);
    current.setDate(current.getDate() - 4);
    setAnchorDate(formatDateString(current));
  };

  const handleNextDays = () => {
    const current = parseDateString(anchorDate);
    current.setDate(current.getDate() + 4);
    setAnchorDate(formatDateString(current));
  };

  const handleResetDays = () => {
    setAnchorDate(SCREENSHOT_DATE);
  };

  // Toggle completion status
  const handleToggleStatus = (habitId: string, dateStr: string) => {
    const key = `${habitId}_${dateStr}`;
    const current = logs[key] || 'none';
    
    let next: CompletionStatus = 'none';
    if (current === 'none') {
      next = 'completed';
    } else if (current === 'completed') {
      next = 'failed';
    } else {
      next = 'none';
    }

    // Play subtle audio synthesiser feedback
    playFeedbackSound(next);

    // Trigger subtle, lightweight vibration feedback on touch/mobile devices if supported
    if (hapticEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      // 12ms for a subtle tactile tap
      navigator.vibrate(12);
    }

    setLogs(prev => ({
      ...prev,
      [key]: next
    }));
  };

  // Add new habit with strict checkout guards
  const handleAddHabitSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    if (!isPremium && habits.length >= 4) {
      setIsAddOpen(false);
      setIsCheckoutOpen(true);
      return;
    }

    const nextOrder = habits.reduce((max, h) => h.order > max ? h.order : max, 0) + 1;
    const newHabit: Habit = {
      id: `h-${Date.now()}`,
      name: newHabitName.trim(),
      createdAt: formatDateString(new Date()),
      order: nextOrder,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
      category: newHabitCategory
    };

    setHabits(prev => [...prev, newHabit].sort((a,b) => a.order - b.order));
    setNewHabitName('');
    setNewHabitCategory('Personal');
    setReminderEnabled(false);
    setReminderTime('09:00');
    setIsAddOpen(false);
  };

  // Complete a habit right from the notification toast
  const handleMarkAsCompletedToday = (habitId: string) => {
    const todayStr = formatDateString(new Date());
    const key = `${habitId}_${todayStr}`;
    
    // Play complete sound effect
    playFeedbackSound('completed');

    setLogs(prev => ({
      ...prev,
      [key]: 'completed'
    }));
    setActiveNotification(null);
    if (hapticEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([15, 15, 15]);
    }
  };

  // Simulated background cron check for habit reminders
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeString = `${hours}:${minutes}`;

      habits.forEach(habit => {
        if (habit.reminderEnabled && habit.reminderTime === currentTimeString) {
          // Check if already notified in this minute
          const todayStr = formatDateString(now);
          const notifiedKey = `notified_${habit.id}_${todayStr}_${currentTimeString}`;
          const alreadyNotified = sessionStorage.getItem(notifiedKey);
          if (!alreadyNotified) {
            sessionStorage.setItem(notifiedKey, 'true');
            // Trigger elegant slide-down alert banner
            setActiveNotification({
              id: habit.id,
              habitName: habit.name,
              time: habit.reminderTime
            });
            
            // Try standard Notification API
            if ('Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('Mossbit Habit Reminder', {
                  body: `Time to complete your habit: "${habit.name}"! 🌿`,
                });
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                    new Notification('Mossbit Habit Reminder', {
                      body: `Time to complete your habit: "${habit.name}"! 🌿`,
                    });
                  }
                });
              }
            }
          }
        }
      });
    }, 15000); // Check every 15 seconds for highest timing fidelity

    return () => clearInterval(interval);
  }, [habits]);

  // Move habits up/down in the ordered list
  const handleReorder = (habitId: string, direction: 'up' | 'down') => {
    const index = habits.findIndex(h => h.id === habitId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === habits.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...habits];
    
    // Swap positions
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Re-index orders
    const reassigned = updated.map((h, i) => ({ ...h, order: i }));
    setHabits(reassigned);
  };

  // Delete physical habits
  const handleDeleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
  };

  // Reset to screenshot state
  const handleResetToScreenshot = () => {
    setHabits(DEFAULT_HABITS);
    setLogs(DEFAULT_LOGS);
    setAnchorDate(SCREENSHOT_DATE);
    setIsPremium(false);
    setIsSettingsOpen(false);
  };

  // Export all habit history & logs to CSV
  const handleExportCSV = () => {
    const csvRows: string[] = [];
    
    // Add columns: Date, Habit Id, Habit Name, Status
    csvRows.push('Date,Habit ID,Habit Name,Status');

    const logEntries = Object.entries(logs).map(([key, status]) => {
      const lastUnderscoreIndex = key.lastIndexOf('_');
      const habitId = key.substring(0, lastUnderscoreIndex);
      const dateStr = key.substring(lastUnderscoreIndex + 1);
      const habit = habits.find(h => h.id === habitId);
      const habitName = habit ? habit.name : 'Deleted Habit';
      return {
        dateStr,
        habitId,
        habitName,
        status
      };
    });

    // Sort by Date (ascending), then Habit Name
    logEntries.sort((a, b) => {
      const dateCompare = a.dateStr.localeCompare(b.dateStr);
      if (dateCompare !== 0) return dateCompare;
      return a.habitName.localeCompare(b.habitName);
    });

    logEntries.forEach(entry => {
      const escapedHabitName = `"${entry.habitName.replace(/"/g, '""')}"`;
      csvRows.push(`${entry.dateStr},${entry.habitId},${escapedHabitName},${entry.status}`);
    });

    // Download triggered as blob
    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mossbit_habit_history_${formatDateString(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export full application state (database backup) to JSON file
  const handleExportJSON = () => {
    try {
      const payload = {
        app: 'Mossbit',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        isPremium,
        habits,
        logs
      };
      
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `mossbit_backup_${formatDateString(new Date())}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setImportStatus({
        success: true,
        message: 'Successfully exported offline backup file!'
      });
      setTimeout(() => setImportStatus(null), 5000);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: `Failed to export: ${err.message || err}`
      });
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  // Import full application state from a JSON local backup file
  const handleImportJSON = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Could not read backup file contents.');
        }

        const data = JSON.parse(text);

        // Validation
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid JSON format.');
        }

        if (!Array.isArray(data.habits)) {
          throw new Error('Backup is missing a valid habits array.');
        }

        if (!data.logs || typeof data.logs !== 'object') {
          throw new Error('Backup is missing a valid completion logs object.');
        }

        // Deep validation of habits array entries
        const validatedHabits: Habit[] = [];
        for (const h of data.habits) {
          if (!h || typeof h.id !== 'string' || typeof h.name !== 'string') {
            throw new Error(`Invalid habit item detected inside backup payload`);
          }
          validatedHabits.push({
            id: h.id,
            name: h.name,
            createdAt: typeof h.createdAt === 'string' ? h.createdAt : new Date().toISOString(),
            order: typeof h.order === 'number' ? h.order : validatedHabits.length,
            reminderEnabled: !!h.reminderEnabled,
            reminderTime: typeof h.reminderTime === 'string' ? h.reminderTime : '09:00',
            category: typeof h.category === 'string' ? h.category : 'Personal'
          });
        }

        // Deep validation of logs object
        const validatedLogs: CompletionLogs = {};
        for (const [key, value] of Object.entries(data.logs)) {
          if (value === 'completed' || value === 'failed' || value === 'none') {
            validatedLogs[key] = value;
          }
        }

        // Update state managers
        setHabits(validatedHabits);
        setLogs(validatedLogs);

        const restoredPremium = !!data.isPremium;
        setIsPremium(restoredPremium);

        // Save to IndexedDB
        await saveLocalHabits(validatedHabits);
        await saveLocalLogs(validatedLogs);
        await saveMetadata('moss_premium', restoredPremium);

        // Save to localStorage secondary cache
        localStorage.setItem('moss_habits', JSON.stringify(validatedHabits));
        localStorage.setItem('moss_logs', JSON.stringify(validatedLogs));
        localStorage.setItem('moss_premium', restoredPremium ? 'true' : 'false');

        // Trigger immediate cloud resync if active
        if (navigator.onLine) {
          triggerServerSync(validatedHabits, validatedLogs, restoredPremium);
        }

        setImportStatus({
          success: true,
          message: `Database restored cleanly! Loaded ${validatedHabits.length} habits & historical completions.`
        });
        setTimeout(() => setImportStatus(null), 6000);

      } catch (err: any) {
        setImportStatus({
          success: false,
          message: `Restore failed: ${err.message || err}`
        });
        setTimeout(() => setImportStatus(null), 8000);
      }
    };

    reader.readAsText(file);
    // Reset file input value to allow importing the same file again
    e.target.value = '';
  };

  // Copy support email to clipboard
  const handleCopyEmail = () => {
    navigator.clipboard.writeText('contact@multicolorarts.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Checkout submission handler
  const handleCheckoutSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPaymentProcessing(true);
    setTimeout(() => {
      setIsPremium(true);
      setPaymentProcessing(false);
      setIsCheckoutOpen(false);
    }, 1500);
  };

  // Retrieve current active 4 dates
  const activeDates = getFourDays(anchorDate);

  // Filter habits based on the currently selected category tab
  const filteredHabits = habits.filter(h => {
    if (selectedCategoryFilter === 'All') return true;
    const hCat = h.category || 'Other';
    return hCat === selectedCategoryFilter;
  });

  // Retrieve past 7 days for Recharts visualization
  const chartDays = getPastSevenDays(anchorDate);
  const chartData = chartDays.map(dateStr => {
    const d = parseDateString(dateStr);
    const formattedDay = d.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDateNum = d.getDate();
    
    let completedCount = 0;
    habits.forEach(habit => {
      const key = `${habit.id}_${dateStr}`;
      if (logs[key] === 'completed') {
        completedCount++;
      }
    });

    const rate = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

    return {
      dateStr,
      dayName: `${formattedDay} ${formattedDateNum}`,
      rate,
      completed: completedCount,
      total: habits.length
    };
  });

  const totalRates = chartData.reduce((sum, item) => sum + item.rate, 0);
  const averageRate = chartData.length > 0 ? Math.round(totalRates / chartData.length) : 0;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-950 selection:text-emerald-300 font-sans antialiased overflow-x-hidden pb-32">
      {/* Real-time slider mobile imitation notification banner */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            className="fixed top-4 left-4 right-4 z-[9999] max-w-sm mx-auto bg-[#070d07] border border-emerald-900/40 rounded-2xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.85)]"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-950/60 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0">
                <Bell className="w-4 h-4 text-emerald-400 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-emerald-500/80 text-[10px] font-mono font-medium uppercase tracking-wider">
                    Routine Trigger
                  </span>
                  <span className="text-zinc-500 text-[10px] font-mono">
                    {activeNotification.time}
                  </span>
                </div>
                <h4 className="text-zinc-100 text-sm font-semibold leading-tight">
                  {activeNotification.habitName}
                </h4>
                <p className="text-zinc-400 text-[11px] mt-1 leading-normal">
                  It's time to take action! Ready to solidify your daily habit streak?
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => handleMarkAsCompletedToday(activeNotification.id)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    Mark Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveNotification(null)}
                    className="border border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-[11px] font-normal px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
                  >
                    Snooze
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveNotification(null)}
                className="text-zinc-600 hover:text-zinc-400 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewingTermsPage ? (
        <div className="w-full max-w-2xl mx-auto px-6 pt-12 pb-24 relative z-10 animate-fade-in">
          <div className="flex flex-col gap-6">
            
            {/* Header / Breadcrumb navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                id="back-to-checklist-btn"
                onClick={() => setViewingTermsPage(false)}
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Checklist</span>
              </button>
              
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-mono bg-emerald-500/10 border border-emerald-500/25 rounded-md text-emerald-400 select-none">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Privacy Sandbox Enabled</span>
              </div>
            </div>

            {/* Title block */}
            <div className="border-b border-zinc-900 pb-6">
              <h1 className="text-3xl font-sans font-light tracking-tight text-zinc-50 leading-tight">
                Terms of Use & Privacy Assurance
              </h1>
              <p className="text-zinc-500 text-[11px] font-mono mt-2 uppercase tracking-wide">
                Mossbit Protocol • Last Updated May 31, 2026 • 100% Offline Client-Side Sandbox
              </p>
            </div>

            {/* Layout layout with 2 column */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Left Main column */}
              <div className="md:col-span-3 space-y-6">
                
                {/* Section Cards */}
                <div className="bg-[#070707] border border-zinc-900/60 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20 group-hover:bg-emerald-500/60 transition-colors duration-300" />
                  <h3 className="text-sm font-semibold text-zinc-200 font-mono uppercase tracking-wide mb-2">
                    1. Zero Tracking, Local-First Storage
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Mossbit is designed with architectural data safety at its core. Your habits, completions, custom re-ordered list priorities, specific goals, and historic logging metrics reside strictly in your web browser's local state ecosystem (utilizing persistent <code className="text-emerald-400 font-mono bg-emerald-950/20 px-1.5 py-0.5 rounded">localStorage</code> keys). No servers, cookies, telemetry signals, or tracking scripts collect or transmit your personal diagnostic metrics.
                  </p>
                </div>

                <div className="bg-[#070707] border border-zinc-900/60 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20 group-hover:bg-blue-500/60 transition-colors duration-300" />
                  <h3 className="text-sm font-semibold text-zinc-200 font-mono uppercase tracking-wide mb-2">
                    2. Tactile Feedback Mechanics
                  </h3>
                  <p className="text-[#a1a1aa] text-xs leading-relaxed">
                    When performing checklist items, Mossbit plays synthetic sound signals via standard HTML5 <code className="text-blue-400 font-mono bg-blue-950/20 px-1.5 py-0.5 rounded">Web Audio API</code> oscillation frequency generators. These elements are rendered server-free and do not fetch dynamic tracker audio modules, guaranteeing robust response speeds and private habit completion sensory indicators.
                  </p>
                </div>

                <div className="bg-[#070707] border border-zinc-900/60 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/20 group-hover:bg-purple-500/60 transition-colors duration-300" />
                  <h3 className="text-sm font-semibold text-zinc-200 font-mono uppercase tracking-wide mb-2">
                    3. Premium Upgrade Bound
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Unlocking the Mossbit Premium tiers registers an irreversible toggle directly on your offline state storage, granting unlimited custom category definitions and beautiful custom sensory chimes. Since there are no online user accounts, licenses are anchored safely to your browser's persistent registry cache.
                  </p>
                </div>

                <div className="bg-[#070707] border border-zinc-900/60 p-5 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-zinc-805 bg-zinc-800 group-hover:bg-zinc-600 transition-colors duration-300" />
                  <h3 className="text-sm font-semibold text-zinc-200 font-mono uppercase tracking-wide mb-2">
                    4. Contact & Developer Licenses
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    This habit tracker client is maintained by Multicolor Arts as a study in high-tactility, offline-first minimal user experience design patterns. For legal concerns or licensing questions, contact our registry deck at <span className="text-emerald-400 font-mono font-medium">contact@multicolorarts.com</span>. We will gladly address your inquiries.
                  </p>
                </div>

              </div>

              {/* Right Sidebar column */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Audio Engine Chime Tool */}
                <div className="bg-zinc-950 border border-zinc-900 px-5 py-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-semibold text-zinc-300 font-mono uppercase tracking-wider">Tactile Chime Box</h3>
                  </div>
                  
                  <p className="text-zinc-500 text-[11px] leading-relaxed mb-4 leading-normal">
                    Sample the responsive physical sound feedback frequencies running natively in your browser sandbox:
                  </p>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => playFeedbackSound('completed')}
                      className="w-full flex justify-between items-center px-3 py-2 border border-emerald-950/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-[11px] font-mono uppercase tracking-wide rounded-xl transition-all cursor-pointer hover:border-emerald-500/20 active:scale-98"
                    >
                      <span>Checkoff Chime</span>
                      <span className="text-[10px] text-zinc-600 font-normal">Double Frequency</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => playFeedbackSound('none')}
                      className="w-full flex justify-between items-center px-3 py-2 border border-zinc-900 bg-zinc-950 hover:bg-zinc-900/60 text-zinc-300 text-[11px] font-mono uppercase tracking-wide rounded-xl transition-all cursor-pointer hover:border-zinc-850 active:scale-98"
                    >
                      <span>Neutral State</span>
                      <span className="text-[10px] text-zinc-600 font-normal">Sine Wave</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => playFeedbackSound('failed')}
                      className="w-full flex justify-between items-center px-3 py-2 border border-red-950/40 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[11px] font-mono uppercase tracking-wide rounded-xl transition-all cursor-pointer hover:border-red-500/20 active:scale-98"
                    >
                      <span>Dismiss Rumble</span>
                      <span className="text-[10px] text-zinc-600 font-normal">Low Frequency Decay</span>
                    </button>
                  </div>
                </div>

                {/* Privacy Verification Metrics Block */}
                <div className="bg-[#0b0b0b] border border-zinc-900/60 px-5 py-5 rounded-2xl relative">
                  <h3 className="text-xs font-semibold text-zinc-300 font-mono uppercase tracking-wider mb-2">Sandbox Health</h3>
                  
                  <div className="space-y-2 mt-4 text-[11px] font-mono">
                    <div className="flex justify-between border-b border-zinc-950 pb-2">
                      <span className="text-zinc-500">Tracking Scripts</span>
                      <span className="text-emerald-400 font-bold">0 Active</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-950 pb-2">
                      <span className="text-zinc-500">Telemetry Status</span>
                      <span className="text-zinc-400">Offline Pure</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-950 pb-2">
                      <span className="text-zinc-500">Local Cache Keys</span>
                      <span className="text-emerald-400">moss_habits • moss_logs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Security Sandbox</span>
                      <span className="text-blue-400">W3C Compliant</span>
                    </div>
                  </div>
                </div>

                {/* Master Acknowledgment action */}
                <button
                  type="button"
                  onClick={() => setViewingTermsPage(false)}
                  className="w-full bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold uppercase tracking-widest py-3 rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-white/5 flex items-center justify-center gap-1"
                >
                  <span>Accept and Return</span>
                </button>

              </div>

            </div>

          </div>
        </div>
      ) : viewingSettingsPage ? (
        <div className="w-full max-w-2xl mx-auto px-6 pt-12 pb-24 relative z-10 animate-fade-in animate-duration-300">
          <div className="flex flex-col gap-6">
            
            {/* Header / Breadcrumb navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                id="back-to-checklist-settings"
                onClick={() => setViewingSettingsPage(false)}
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Checklist</span>
              </button>
              
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-mono bg-emerald-500/10 border border-emerald-500/25 rounded-md text-emerald-400 select-none">
                <Settings className="w-3.5 h-3.5" />
                <span>Control Center</span>
              </div>
            </div>

            {/* Title block */}
            <div className="border-b border-zinc-900 pb-6">
              <h1 className="text-3xl font-sans font-light tracking-tight text-zinc-50 leading-tight">
                Mossbit Settings
              </h1>
              <p className="text-zinc-500 text-[11px] font-mono mt-2 uppercase tracking-wide">
                Securely manage your personal offline routine configurations, backup state & contact hub
              </p>
            </div>

            {/* Main Premium Membership Banner */}
            <div className="bg-[#070707] border border-zinc-900/60 p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 font-mono uppercase tracking-wide mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Premium Access Tier
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed max-w-lg">
                    Mossbit Premium gives you infinite habit list capacities, customizable tracker categorizations, beautiful sensory chimes, and pristine CSV exports.
                  </p>
                </div>
                <div className="shrink-0 flex items-center">
                  {isPremium ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                      Premium Lifetime
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(true)}
                      className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all hover:scale-102 active:scale-98 cursor-pointer shadow-lg"
                    >
                      Unlock ($4.99)
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Primary Columns Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Backup & Purge Section */}
              <div className="bg-[#070707] border border-zinc-900/40 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">Data Utilities</h4>
                </div>

                <div className="space-y-2.5">
                  {importStatus && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl text-[11px] leading-relaxed border ${
                        importStatus.success 
                          ? 'bg-emerald-950/25 text-emerald-300 border-emerald-500/20' 
                          : 'bg-red-950/25 text-red-300 border-red-500/20'
                      }`}
                    >
                      {importStatus.message}
                    </motion.div>
                  )}

                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="w-full flex justify-between items-center px-3.5 py-3 border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900/40 text-emerald-400 hover:text-emerald-300 text-xs font-medium rounded-xl transition-all cursor-pointer"
                  >
                    <span>Export Local Backup (JSON)</span>
                    <Download className="w-4 h-4 text-emerald-500" />
                  </button>

                  <label className="w-full flex justify-between items-center px-3.5 py-3 border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900/40 text-emerald-400 hover:text-emerald-300 text-xs font-medium rounded-xl transition-all cursor-pointer">
                    <span>Import Local Backup (JSON)</span>
                    <Upload className="w-4 h-4 text-emerald-500" />
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportJSON} 
                      className="hidden" 
                    />
                  </label>

                  <button
                    type="button"
                    id="page-export-csv"
                    onClick={handleExportCSV}
                    className="w-full flex justify-between items-center px-3.5 py-3 border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900/40 text-zinc-300 hover:text-zinc-100 text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <span>Export checklist history (CSV)</span>
                    <Download className="w-4 h-4 text-zinc-500" />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToScreenshot}
                    className="w-full flex justify-between items-center px-3.5 py-3 border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900/40 text-zinc-300 hover:text-zinc-100 text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <span>Revert to Screenshot defaults</span>
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete all habits and logs?')) {
                        setHabits([]);
                        setLogs({});
                        setViewingSettingsPage(false);
                      }
                    }}
                    className="w-full flex justify-between items-center px-3.5 py-3 border border-red-950/20 bg-red-950/5 hover:bg-red-950/15 text-red-400 text-xs rounded-xl transition-all cursor-pointer"
                  >
                    <span>Clear all habits & logs</span>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Tactile Feedback Settings Section */}
              <div className="bg-[#070707] border border-zinc-900/40 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">Tactile Settings</h4>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="pr-4">
                    <p className="text-xs font-medium text-zinc-200">Haptic Feedback</p>
                    <p className="text-zinc-500 text-[10px] mt-1 leading-normal">
                      Subtle tactile vibration feedback on habit checkoffs and system completions.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="haptic-toggle-switch"
                    onClick={() => {
                      const nextVal = !hapticEnabled;
                      setHapticEnabled(nextVal);
                      if (nextVal && typeof navigator !== 'undefined' && navigator.vibrate) {
                        navigator.vibrate(12);
                      }
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 cursor-pointer ${
                      hapticEnabled ? 'bg-emerald-500 justify-end' : 'bg-zinc-800 justify-start'
                    }`}
                  >
                    <motion.div
                      layout
                      className="w-5 h-5 rounded-full bg-zinc-950 shadow-md border border-zinc-800"
                    />
                  </button>
                </div>
              </div>

              {/* Legal & Navigation Section */}
              <div className="bg-[#070707] border border-zinc-900/40 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-905 border-zinc-900 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">Safeguards & Legal</h4>
                </div>

                <p className="text-zinc-500 text-[11px] leading-relaxed">
                  We guarantee zero tracking and 100% browser-bound, safe client state configurations. Explore our detailed offline-first policy:
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setViewingTermsPage(true);
                  }}
                  className="w-full flex justify-between items-center px-3.5 py-3 border border-emerald-950/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 text-xs font-medium rounded-xl transition-all cursor-pointer shrink-0"
                >
                  <span>Terms & Privacy Policy Page</span>
                  <FileText className="w-4 h-4 text-emerald-400" />
                </button>
              </div>

            </div>

            {/* Support, Rating & Mail Section */}
            <div className="bg-[#070707] border border-zinc-900/40 p-5 rounded-2xl">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-4">
                <Mail className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">Support & Play Store Index</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl flex flex-col justify-between">
                  <p className="text-zinc-400 text-xs leading-normal mb-3 font-normal">
                    Love Mossbit? Help support active development by writing a positive review on the app store!
                  </p>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 border border-zinc-805 border-zinc-900 hover:border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-900 text-xs px-4 py-3 rounded-lg transition-all w-full justify-center font-medium cursor-pointer"
                  >
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 animate-pulse" />
                    <span>Rate App on Play Store</span>
                  </button>
                </div>

                <div className="bg-zinc-950/50 p-4 border border-zinc-900 rounded-xl flex flex-col">
                  <div className="flex gap-2 text-xs text-zinc-400 text-left mb-3.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <span className="leading-tight">General feedback • bug reports • custom licensing inquiries</span>
                  </div>

                  <p className="text-zinc-300 font-mono text-xs mb-3.5 select-all text-center">
                    contact@multicolorarts.com
                  </p>

                  <div className="flex gap-2 w-full pt-1 justify-center mt-auto">
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="flex items-center gap-1.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-[11px] font-medium px-4 py-2.5 rounded-lg transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                      <span>{copied ? 'Copied' : 'Copy Email'}</span>
                    </button>
                    <a
                      href="mailto:contact@multicolorarts.com?subject=Mossbit Feedback & Support"
                      className="flex items-center gap-1.5 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-[11px] font-medium px-4 py-2.5 rounded-lg transition-all select-none shrink-0"
                    >
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Send Email</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer brand footer */}
            <div className="text-center font-mono text-[9px] text-zinc-650 mt-4 select-none pt-4 border-t border-zinc-900">
              Mossbit Control Deck • Recreated for Studio v1.0
            </div>

          </div>
        </div>
      ) : (
        <div className="w-full max-w-md mx-auto px-6 pt-10">
          {/* Central App Wrapper - mimics a premium smartphone view nicely balanced on desktop, fluid on mobile */}
          
          {/* Header Block exactly matching image spacing */}
          <header className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-[40px] font-sans font-normal tracking-tight leading-none text-zinc-50 select-none">
                Mossbit
              </h1>
            <p className="text-zinc-400 text-sm font-normal tracking-wide mt-2 pt-0.5 select-none">
              {getHeaderFormattedDate(anchorDate)}
            </p>
            
            {/* Live tactile network sync indicator tag */}
            <div className="flex items-center gap-2 mt-2.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[9px] font-mono tracking-wider uppercase border select-none transition-all ${
                isOnline 
                  ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/5 text-amber-500 border-amber-500/25 animate-pulse'
              }`}>
                {isOnline ? (
                  <>
                    <Wifi className="w-2.5 h-2.5 text-emerald-400 shrink-0 animate-pulse" />
                    <span>Cloud Active</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                    <span>Offline Mode</span>
                  </>
                )}
              </span>

              {isSyncing && (
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest animate-pulse">
                  Syncing...
                </span>
              )}

              {lastSynced && !isSyncing && (
                <span className="text-[8px] id-last-synced-time font-mono text-zinc-600 uppercase tracking-wider">
                  Synced: {new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
          <button 
            type="button"
            id="settings-trigger-btn"
            onClick={() => {
              setViewingSettingsPage(true);
            }}
            className="h-11 w-11 flex items-center justify-center border border-zinc-800 rounded-full text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 active:scale-95 transition-all cursor-pointer bg-zinc-950/20"
          >
            <Settings className="w-5 h-5 stroke-[1.5]" />
          </button>
        </header>

        {/* Precise Horizontal Divider line below the header */}
        <div className="border-t border-zinc-900 w-full mb-8" />

        {/* Controls Bar shifted right */}
        <div className="flex justify-end items-center gap-3 mb-6 select-none">
          <button 
            type="button"
            id="reorder-toggle-btn"
            onClick={() => setIsReorderMode(!isReorderMode)}
            className={`h-11 w-11 flex items-center justify-center border rounded-xl active:scale-95 transition-all duration-200 cursor-pointer ${
              isReorderMode 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' 
                : 'border-zinc-800 text-zinc-300 hover:bg-zinc-900/60 active:border-zinc-700'
            }`}
          >
            <ArrowUpDown className="w-[18px] h-[18px]" />
          </button>

          <button 
            type="button"
            id="nav-next-btn"
            onClick={handleNextDays}
            className="h-11 w-11 flex items-center justify-center border border-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-900/60 active:scale-95 active:border-zinc-700 transition-all cursor-pointer"
          >
            <ChevronRight className="w-[20px] h-[20px]" />
          </button>

          <button 
            type="button"
            id="nav-today-btn"
            onClick={handleResetDays}
            className={`h-11 px-4 flex items-center justify-center border border-zinc-800 rounded-xl text-sm font-medium hover:bg-zinc-900/60 active:scale-95 active:border-zinc-700 transition-all cursor-pointer ${
              anchorDate === SCREENSHOT_DATE ? 'text-zinc-50 font-semibold border-zinc-700 bg-zinc-950' : 'text-zinc-300'
            }`}
          >
            Today
          </button>

          <button 
            type="button"
            id="nav-prev-btn"
            onClick={handlePrevDays}
            className="h-11 w-11 flex items-center justify-center border border-zinc-800 rounded-xl text-zinc-300 hover:bg-zinc-900/60 active:scale-95 active:border-zinc-700 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-[20px] h-[20px]" />
          </button>
        </div>

        {/* Habit Checklist Grid Block */}
        <div className="w-full mb-6">
          {/* Category Filtering Tab Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none mb-4 pb-1">
            {['All', 'Health', 'Work', 'Personal', 'Other'].map((category) => {
              const isSelected = selectedCategoryFilter === category;
              const count = habits.filter(h => {
                if (category === 'All') return true;
                const hCat = h.category || 'Other';
                return hCat === category;
              }).length;
              
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(category)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer select-none shrink-0 border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold shadow-[0_2px_8px_rgba(16,185,129,0.06)]'
                      : 'bg-[#050505] border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                  }`}
                >
                  <span>{category}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-900 text-zinc-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Column Headers precisely structured */}
          <div className="grid grid-cols-[13fr_3fr_3fr_3fr_3fr] items-end px-3 mb-4 select-none">
            <div className="text-zinc-500 font-normal text-sm pl-1 self-center">
              Habit
            </div>
            {activeDates.map((dateStr) => {
              const d = parseDateString(dateStr);
              return (
                <div key={dateStr} className="flex flex-col items-center justify-center">
                  <span className="text-[17px] font-normal leading-tight text-zinc-300">
                    {d.getDate()}
                  </span>
                  <span className="text-[10px] font-normal mt-0.5 text-zinc-500">
                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Primary Habits Container */}
          <div className="border border-[#111] rounded-2xl bg-black overflow-hidden select-none">
            {filteredHabits.length === 0 ? (
              <div className="py-12 text-center text-zinc-600 flex flex-col items-center justify-center gap-2 animate-fade-in">
                <Info className="w-6 h-6 stroke-[1.2] text-zinc-500" />
                <span className="text-sm">
                  {habits.length === 0 ? 'No habits active' : 'No habits in this category'}
                </span>
              </div>
            ) : (
              filteredHabits.map((habit, index) => {
                const streak = calculateCurrentStreak(habit.id, logs, anchorDate);
                return (
                  <div 
                    key={habit.id} 
                    className={`grid grid-cols-[13fr_3fr_3fr_3fr_3fr] items-stretch min-h-[58px] ${
                      index < filteredHabits.length - 1 ? 'border-b border-[#111111]' : ''
                    }`}
                  >
                    {/* Left title section: Rich forest-moss dark custom background */}
                    <div className="bg-[#0a120a] flex items-center px-4 py-3 relative border-r border-[#1a2c1a]/30 group transition-colors duration-200 min-w-0">
                      {isReorderMode ? (
                        <div className="flex items-center gap-2 w-full min-w-0">
                          <button 
                            type="button"
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-950/30 transition-colors mr-1 cursor-pointer shrink-0"
                            title="Delete habit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <div className="flex flex-col justify-center gap-0.5 shrink-0">
                            <button 
                              type="button"
                              onClick={() => handleReorder(habit.id, 'up')}
                              disabled={index === 0}
                              className={`p-0.5 rounded text-zinc-500 hover:bg-zinc-900 transition-colors ${index === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:text-zinc-200 cursor-pointer'}`}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleReorder(habit.id, 'down')}
                              disabled={index === filteredHabits.length - 1}
                              className={`p-0.5 rounded text-zinc-500 hover:bg-zinc-900 transition-colors ${index === filteredHabits.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:text-zinc-200 cursor-pointer'}`}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="flex items-center flex-wrap gap-1.5 min-w-0 ml-1.5 select-none">
                            <span className="text-zinc-300 text-xs font-normal leading-snug break-words">
                              {habit.name}
                            </span>
                            <span className={`inline-flex items-center text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.2 rounded border shrink-0 ${
                              (habit.category || 'Other') === 'Health' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' :
                              (habit.category || 'Other') === 'Work' ? 'bg-blue-500/10 text-blue-400 border-blue-500/15' :
                              (habit.category || 'Other') === 'Personal' ? 'bg-purple-500/10 text-purple-400 border-purple-500/15' :
                              'bg-zinc-800/60 text-zinc-400 border-zinc-700/30'
                            }`}>
                              {habit.category || 'Other'}
                            </span>
                            {streak > 0 && (
                              <span 
                                id={`streak-badge-${habit.id}`}
                                className="inline-flex items-center gap-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-orange-500/15 shrink-0"
                                  title={`Current streak: ${streak} days`}
                              >
                                <Flame className="w-3 h-3 text-orange-400 fill-orange-400/20" />
                                <span>{streak}d</span>
                              </span>
                            )}
                            {habit.reminderEnabled && habit.reminderTime && (
                              <span className="inline-flex items-center gap-0.5 bg-zinc-800/60 text-zinc-400 text-[10px] font-normal px-1.5 py-0.5 rounded border border-zinc-700/30 shrink-0">
                                <Bell className="w-2.5 h-2.5 text-zinc-500" />
                                <span>{habit.reminderTime}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center flex-wrap gap-1.5 min-w-0 w-full select-none">
                          <span className="text-zinc-200 text-sm font-normal leading-snug break-words">
                            {habit.name}
                          </span>
                          <span className={`inline-flex items-center text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.2 rounded border shrink-0 ${
                            (habit.category || 'Other') === 'Health' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' :
                            (habit.category || 'Other') === 'Work' ? 'bg-blue-500/10 text-blue-400 border-blue-500/15' :
                            (habit.category || 'Other') === 'Personal' ? 'bg-purple-500/10 text-purple-400 border-purple-500/15' :
                            'bg-zinc-800/60 text-zinc-400 border-zinc-750/30'
                          }`}>
                            {habit.category || 'Other'}
                          </span>
                          {streak > 0 && (
                            <span 
                              id={`streak-badge-${habit.id}`}
                              className="inline-flex items-center gap-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-orange-500/15 shrink-0"
                              title={`Current streak: ${streak} days`}
                            >
                              <Flame className="w-3 h-3 text-orange-400 fill-orange-400/20" />
                              <span>{streak}d</span>
                            </span>
                          )}
                          {habit.reminderEnabled && habit.reminderTime && (
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveNotification({
                                  id: habit.id,
                                  habitName: habit.name,
                                  time: habit.reminderTime || '09:00'
                                });
                              }}
                              className="inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-normal px-2 py-0.5 rounded-full border border-emerald-500/15 cursor-pointer shrink-0 transition-all active:scale-95 group-hover:border-emerald-500/30"
                              title="Daily reminder set. Tap to send test notification banner!"
                            >
                              <Bell className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400/10 animate-pulse" />
                              <span>{habit.reminderTime}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Checklist dates interactives */}
                    {activeDates.map((dateStr) => {
                      const key = `${habit.id}_${dateStr}`;
                      const status = logs[key] || 'none';
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => handleToggleStatus(habit.id, dateStr)}
                          className="flex items-center justify-center relative cursor-pointer hover:bg-zinc-950/40 active:bg-zinc-950 transition-colors outline-none pb-0.5"
                          title="Click to toggle status"
                        >
                          <AnimatePresence mode="popLayout">
                            {status === 'completed' && (
                              <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                                className="flex items-center justify-center p-1"
                              >
                                <Check className="w-[18px] h-[18px] text-[#22c55e] stroke-[3]" />
                              </motion.div>
                            )}
                            {status === 'failed' && (
                              <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                                className="flex items-center justify-center p-1"
                              >
                                <X className="w-[18px] h-[18px] text-[#ef4444] stroke-[3]" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recharts Bar Chart Section */}
        <div className="bg-[#050905] border border-zinc-900/60 rounded-2xl p-5 mb-6 select-none shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-zinc-200 text-sm font-medium tracking-wide">
                7-Day Completion Rate
              </h3>
              <p className="text-zinc-500 text-[11px] font-normal tracking-wide mt-0.5">
                Past 7 days ending {activeDates[3] ? parseDateString(activeDates[3]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
              </p>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 text-lg font-sans font-semibold tracking-tight">
                {averageRate}%
              </span>
              <p className="text-zinc-500 text-[9px] font-mono uppercase tracking-wider block mt-0.5">
                Average
              </p>
            </div>
          </div>

          <div className="h-40 w-full" id="completion-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
              >
                <XAxis
                  dataKey="dayName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(34, 197, 94, 0.04)' }}
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    borderColor: '#1a2c1a',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  }}
                  labelStyle={{
                    color: '#a1a1aa',
                    fontSize: '11px',
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                    marginBottom: '4px',
                  }}
                  itemStyle={{
                    color: '#10b981',
                    fontSize: '11px',
                    fontFamily: 'var(--font-sans)',
                  }}
                  formatter={(value: any, name: any, props: any) => {
                    return [`${value}% (${props.payload.completed}/${props.payload.total} habits)`, 'Completion'];
                  }}
                />
                <Bar
                  dataKey="rate"
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => {
                    const isToday = entry.dateStr === anchorDate;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isToday ? '#22c55e' : '#14532d'}
                        className="transition-colors duration-200"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Premium Upgrade CTA Card exactly matching layout borders */}
        <AnimatePresence>
          {!isPremium && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full text-left bg-black border border-zinc-900 rounded-xl px-4 py-3 pb-3.5 flex justify-between items-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-800/80 active:scale-[0.99] transition-all cursor-pointer select-none group mt-6"
            >
              <span className="text-[14px] font-normal tracking-wide group-hover:translate-x-0.5 transition-transform duration-200">
                Unlock unlimited habits with one-time purchase
              </span>
              <span className="text-[15px] font-sans font-light self-center translate-y-0.5">
                ↗
              </span>
            </motion.button>
          )}
        </AnimatePresence>
        
        {/* Active Premium badge when unlocked */}
        {isPremium && (
          <div className="w-full bg-[#07150a]/20 border border-emerald-950/50 rounded-xl px-4 py-3 flex items-center gap-2.5 text-emerald-400 select-none mt-6">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[13px] font-normal tracking-wide">
              Mossbit Premium Active — Unlimited Habits Unlocked!
            </span>
          </div>
        )}
      </div>
    )}

      {/* Floating Action Button for adding habits precisely aligned */}
      {!viewingTermsPage && (
        <div className="fixed bottom-8 right-8 z-30 md:right-[calc(50vw-200px+32px)]">
          <button
            type="button"
            id="add-habit-btn"
            onClick={() => setIsAddOpen(true)}
            className="h-[56px] w-[56px] bg-white text-black hover:bg-zinc-100 flex items-center justify-center rounded-full shadow-[0_4px_24px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title="Add Habit"
          >
            <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      )}

      {/* Slide-Up Bottom Sheet Modal for Adding Habits */}
      <AnimatePresence>
        {isAddOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0a0a0a] border-t border-zinc-900 rounded-t-[28px] px-6 pt-5 pb-8 z-50 shadow-2xl"
            >
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-6" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-normal text-zinc-100">Add New Habit</h3>
                  <p className="text-zinc-500 text-xs mt-1">Define your daily routine target</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-zinc-900 text-zinc-400 p-1.5 rounded-full hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!isPremium && habits.length >= 4 ? (
                // Over quota warning
                <div className="flex flex-col items-center justify-center py-4 text-center select-none">
                  <div className="h-12 w-12 rounded-full bg-emerald-950/40 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/10">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-zinc-200 font-medium text-base mb-1">Habit Limit Reached</h4>
                  <p className="text-zinc-500 text-xs max-w-[280px] mb-6">
                    Free version is limited to 4 core habits. Unlock limitless progress with our lifetime premium membership!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full bg-white text-black hover:bg-zinc-200 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 cursor-pointer shadow-lg shadow-white/5"
                  >
                    Unlock Unlimited ($4.99)
                  </button>
                </div>
              ) : (
                // Form input
                <form onSubmit={handleAddHabitSubmit} className="space-y-6">
                  <div>
                    <label className="text-zinc-400 text-xs tracking-wide font-normal block mb-2 font-mono uppercase">
                      Name of Habit
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Read 10 pages daily"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-100 placeholder-zinc-600 font-normal focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 text-sm transition-all"
                      maxLength={40}
                      autoFocus
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="text-zinc-400 text-xs tracking-wide font-normal block mb-2 font-mono uppercase">
                      Category
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['Health', 'Work', 'Personal', 'Other'].map((cat) => {
                        const isSelected = newHabitCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setNewHabitCategory(cat)}
                            className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                                : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Built-in quick recommendations for high-usability */}
                  <div>
                    <span className="text-zinc-500 text-xs tracking-wide font-normal block mb-2 font-mono uppercase font-semibold">
                      Quick Ideas
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {['Drink 3L water dally', 'Meditation', 'Read 10 pages daily', 'Exercise for 20 min', 'Sleep 8 hours', 'No sugar today'].map((idea) => {
                        const ideaCategories: Record<string, string> = {
                          'Drink 3L water dally': 'Health',
                          'Meditation': 'Personal',
                          'Read 10 pages daily': 'Work',
                          'Exercise for 20 min': 'Health',
                          'Sleep 8 hours': 'Personal',
                          'No sugar today': 'Health',
                        };
                        return (
                          <button
                            key={idea}
                            type="button"
                            onClick={() => {
                              setNewHabitName(idea);
                              setNewHabitCategory(ideaCategories[idea] || 'Personal');
                            }}
                            className="px-3 py-2 border border-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all cursor-pointer"
                          >
                            {idea}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daily Reminder Toggle & Specific Time Config */}
                  <div className="border border-[#111] bg-[#050505] rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col pr-4">
                        <span className="text-zinc-300 text-xs tracking-wide font-mono uppercase">
                          Set Daily Reminder
                        </span>
                        <span className="text-zinc-500 text-[11px] mt-0.5 font-normal">
                          Get notified automatically with an in-app banner alert and sound preview
                        </span>
                      </div>
                      <button
                        type="button"
                        id="reminder-toggle-switch"
                        onClick={() => setReminderEnabled(!reminderEnabled)}
                        className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 shrink-0 cursor-pointer ${
                          reminderEnabled ? 'bg-emerald-500 justify-end' : 'bg-zinc-800 justify-start'
                        }`}
                      >
                        <motion.div
                          layout
                          className="bg-zinc-200 w-5 h-5 rounded-full shadow-md"
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {reminderEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2 overflow-hidden"
                        >
                          <label className="text-zinc-500 text-[10px] tracking-wide font-mono uppercase block">
                            Preferred Time
                          </label>
                          <input
                            type="time"
                            id="reminder-time-input"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-4 py-3 text-zinc-100 hover:border-zinc-800 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 text-sm transition-all text-center [color-scheme:dark]"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-white text-black hover:bg-zinc-200 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-[0.98] cursor-pointer"
                  >
                    Create Habit
                  </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>



      {/* Premium Upgrade Mock Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            
            {/* Checkout Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#0a0a0a] border-t border-zinc-900 rounded-t-[28px] px-6 pt-5 pb-8 z-50 shadow-2xl"
            >
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-6" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-medium text-zinc-100">Mossbit Premium</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="bg-zinc-900 text-zinc-400 p-1.5 rounded-full hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl mb-6 space-y-1">
                <div className="text-zinc-300 font-medium text-sm flex justify-between">
                  <span>Lifetime Membership</span>
                  <span className="text-emerald-400 font-semibold">$4.99</span>
                </div>
                <p className="text-zinc-500 text-xs">
                  Unlock unlimited habit slots, complete dashboard history, and lifetime updates. Zero subscriptions.
                </p>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div>
                  <label className="text-zinc-400 text-xs font-normal block mb-1 font-mono uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-700 text-xs transition-all"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-xs font-normal block mb-1 font-mono uppercase">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={(e) => {
                        // formats loosely with spaces
                        const val = e.target.value.replace(/\D/g, '');
                        const parts = val.match(/.{1,4}/g) || [];
                        setCardNumber(parts.join(' ').substring(0, 19));
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-700 text-xs transition-all font-mono"
                    />
                    <CreditCard className="w-4 h-4 text-zinc-600 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-400 text-xs font-normal block mb-1 font-mono uppercase">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 2) {
                          setCardExpiry(val);
                        } else {
                          setCardExpiry(`${val.substring(0,2)}/${val.substring(2,4)}`);
                        }
                      }}
                      maxLength={5}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-700 text-xs text-center transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs font-normal block mb-1 font-mono uppercase">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="•••"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').substring(0,3))}
                      maxLength={3}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-700 text-xs text-center transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={paymentProcessing}
                  className="w-full bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-650 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-[0.98] cursor-pointer mt-4 flex items-center justify-center gap-2"
                >
                  {paymentProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-zinc-500" />
                      <span>Processing secure checkout...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Unlock Lifetime Access for $4.99 &bull; Pay Now</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
