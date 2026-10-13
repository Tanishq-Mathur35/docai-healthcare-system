import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, Pill, AlertCircle, Info, ExternalLink, X } from 'lucide-react';
import { patientService } from '@/services/patient.service';
import { getSocket } from '@/lib/socket';
import { useToast } from '@/store/notificationStore';
import { useTranslation } from '@/store/languageStore';
import { formatDateTime } from '@/lib/utils';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast, success } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fetch notifications
  const { data: notifRes } = useQuery({
    queryKey: ['patient-notifications'],
    queryFn: () => patientService.getNotifications({ limit: 15 }),
    refetchInterval: 15000, // Background poll every 15s in addition to sockets
  });

  const notifications: any[] = notifRes?.data?.data?.items || notifRes?.data?.items || [];
  const unreadCount: number = notifRes?.data?.data?.unreadCount ?? notifications.filter((n) => !n.isRead).length;

  // Mark single as read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => patientService.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-notifications'] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: () => patientService.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-notifications'] });
    },
  });

  // Listen to live socket notifications
  useEffect(() => {
    const socket = getSocket();

    const handlePrescriptionAlert = (data: any) => {
      success(data.title || '💊 New Prescription Issued!', data.body || data.message || 'A doctor has issued a new prescription.');
      queryClient.invalidateQueries({ queryKey: ['patient-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['patient-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['patient-dashboard'] });
    };

    const handleGeneralNotification = (data: any) => {
      toast({
        title: data.title || 'New Healthcare Notification',
        description: data.body || data.message,
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['patient-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['patient-prescriptions'] });
    };

    socket.on('prescription_issued', handlePrescriptionAlert);
    socket.on('notification', handleGeneralNotification);

    return () => {
      socket.off('prescription_issued', handlePrescriptionAlert);
      socket.off('notification', handleGeneralNotification);
    };
  }, [queryClient, success, toast]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.id);
    }
    setIsOpen(false);
    if (notif.title?.includes('Prescription') || notif.body?.includes('prescription')) {
      navigate('/patient/prescriptions');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 rounded-xl border border-sky-200 bg-white hover:bg-sky-50 flex items-center justify-center text-slate-700 transition-all shadow-2xs"
        aria-label="View notifications"
      >
        <Bell className="h-4 w-4 text-sky-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-sky-100 bg-white shadow-xl shadow-sky-900/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-sky-50 to-teal-50 border-b border-sky-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">{t.notifications}</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-sky-200/80 text-sky-800 text-[11px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="text-[11px] text-sky-700 hover:text-sky-900 font-bold hover:underline flex items-center gap-1"
                disabled={markAllReadMutation.isPending}
              >
                <Check className="h-3 w-3" /> {t.markAllRead}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Bell className="h-8 w-8 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-600">{t.noNotifications}</p>
                <p className="text-[11px] text-slate-400">Doctor issued prescriptions and emergency alerts appear here.</p>
              </div>
            ) : (
              notifications.map((notif: any) => {
                const isPrescription =
                  notif.title?.includes('Prescription') || notif.body?.includes('prescription');

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-sky-50/60 ${
                      !notif.isRead ? 'bg-sky-50/40' : 'bg-white'
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-xs shadow-2xs ${
                        isPrescription
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-sky-100 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {isPrescription ? <Pill className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs ${!notif.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="h-2 w-2 rounded-full bg-sky-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {formatDateTime(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              to="/patient/prescriptions"
              onClick={() => setIsOpen(false)}
              className="text-xs text-sky-700 font-bold hover:underline inline-flex items-center gap-1"
            >
              <Pill className="h-3.5 w-3.5" /> View All Prescriptions
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

