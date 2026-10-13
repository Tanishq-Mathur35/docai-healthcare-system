import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  PhoneCall,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldAlert,
  History,
  X,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/notificationStore';
import { emergencyService, EmergencyCallRecord } from '@/services/emergency.service';
import { formatDateTime } from '@/lib/utils';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface EmergencyVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'PATIENT' | 'DOCTOR';
  initialCall?: EmergencyCallRecord | null;
}

export default function EmergencyVideoModal({
  isOpen,
  onClose,
  role,
  initialCall,
}: EmergencyVideoModalProps) {
  const { accessToken, user } = useAuthStore();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'call' | 'history'>('call');
  const [reason, setReason] = useState('Severe chest discomfort / urgent medical help needed');
  const [activeCall, setActiveCall] = useState<EmergencyCallRecord | null>(initialCall || null);
  const [callHistory, setCallHistory] = useState<EmergencyCallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reassignTimer, setReassignTimer] = useState(20);

  // Media / WebRTC states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (initialCall) {
      setActiveCall(initialCall);
      setActiveTab('call');
    }
  }, [initialCall]);

  // Fetch call history and active call when modal opens
  useEffect(() => {
    if (!isOpen) return;
    emergencyService
      .getHistory()
      .then((res) => setCallHistory(res.data?.data || []))
      .catch(() => {});

    if (!activeCall) {
      emergencyService
        .getActiveCall()
        .then((res) => {
          if (res.data?.data) setActiveCall(res.data.data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // 20-second visual countdown while RINGING
  useEffect(() => {
    if (!activeCall || activeCall.status !== 'RINGING') return;
    setReassignTimer(20);
    const interval = setInterval(() => {
      setReassignTimer((prev) => (prev > 1 ? prev - 1 : 20));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall?.id, activeCall?.status, activeCall?.assignedDoctorUserId]);

  // Call duration timer when ACCEPTED
  useEffect(() => {
    if (!activeCall || activeCall.status !== 'ACCEPTED') {
      setCallDuration(0);
      return;
    }
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall?.status]);

  // Socket & WebRTC Signaling Setup
  useEffect(() => {
    if (!accessToken) return;
    const socketUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')
      : window.location.origin;

    const socket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('emergency_status', (updatedCall: EmergencyCallRecord) => {
      setActiveCall(updatedCall);
    });

    socket.on('emergency_accepted', (acceptedCall: EmergencyCallRecord) => {
      setActiveCall(acceptedCall);
      success(
        'Doctor Connected!',
        `${acceptedCall.assignedDoctorName} accepted your emergency call.`
      );
    });

    socket.on('emergency_reassigned', (reassignedCall: EmergencyCallRecord & { message?: string }) => {
      setActiveCall(reassignedCall);
      setReassignTimer(20);
      success(
        'Auto-Reassigned to Available Doctor',
        reassignedCall.message || `Now ringing ${reassignedCall.assignedDoctorName}`
      );
    });

    socket.on('emergency_ended', (endedCall: EmergencyCallRecord) => {
      setActiveCall(endedCall);
      cleanupMedia();
      emergencyService
        .getHistory()
        .then((res) => setCallHistory(res.data?.data || []))
        .catch(() => {});
    });

    // WebRTC peer events
    socket.on('webrtc_peer_joined', async () => {
      setPeerConnected(true);
      if (peerConnectionRef.current && activeCall?.roomId) {
        try {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit('webrtc_offer', { roomId: activeCall.roomId, offer });
        } catch {}
      }
    });

    socket.on('webrtc_offer', async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      if (!peerConnectionRef.current || !activeCall?.roomId) return;
      try {
        setPeerConnected(true);
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('webrtc_answer', { roomId: activeCall.roomId, answer });
      } catch {}
    });

    socket.on('webrtc_answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      if (!peerConnectionRef.current) return;
      try {
        setPeerConnected(true);
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch {}
    });

    socket.on('webrtc_ice_candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (!peerConnectionRef.current || !candidate) return;
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {}
    });

    socket.on('webrtc_peer_left', () => {
      setPeerConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, activeCall?.roomId]);

  // Start local camera + WebRTC PeerConnection when call is ACCEPTED
  useEffect(() => {
    if (!isOpen || !activeCall || activeCall.status !== 'ACCEPTED') return;

    let mounted = true;

    async function startWebRTC() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setPeerConnected(true);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && socketRef.current && activeCall) {
            socketRef.current.emit('webrtc_ice_candidate', {
              roomId: activeCall.roomId,
              candidate: event.candidate,
            });
          }
        };

        if (socketRef.current && activeCall) {
          socketRef.current.emit('webrtc_join_room', { roomId: activeCall.roomId });
        }
      } catch {
        // Camera/mic permission fallback so call UI still functions smoothly on desktops without webcam
        if (socketRef.current && activeCall) {
          socketRef.current.emit('webrtc_join_room', { roomId: activeCall.roomId });
        }
      }
    }

    startWebRTC();

    return () => {
      mounted = false;
      cleanupMedia();
    };
  }, [isOpen, activeCall?.status, activeCall?.roomId]);

  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setPeerConnected(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  const handleRequestEmergency = async () => {
    setIsLoading(true);
    try {
      const res = await emergencyService.requestCall(reason);
      const callData = res.data.data;
      setActiveCall(callData);
      success(
        'Emergency Call Initiated',
        `Ringing ${callData.assignedDoctorName} (${callData.assignedDoctorSpecialization})`
      );
    } catch (err: any) {
      error('Emergency Request Failed', err.response?.data?.message || 'Could not reach emergency service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptCall = async () => {
    if (!activeCall) return;
    setIsLoading(true);
    try {
      const res = await emergencyService.acceptCall(activeCall.id);
      setActiveCall(res.data.data);
      success('Emergency Call Accepted', `Connected with patient ${activeCall.patientName}`);
    } catch (err: any) {
      error('Failed to Accept', err.response?.data?.message || 'Error accepting call');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReassignCall = async () => {
    if (!activeCall) return;
    setIsLoading(true);
    try {
      const res = await emergencyService.reassignCall(activeCall.id, 'Doctor unavailable / manual reassignment');
      setActiveCall(res.data.data);
      success('Call Reassigned', `Assigned to ${res.data.data.assignedDoctorName}`);
    } catch (err: any) {
      error('Reassignment Failed', err.response?.data?.message || 'No other doctors available');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = async () => {
    if (!activeCall) return;
    try {
      const res = await emergencyService.endCall(activeCall.id, 'Emergency video consultation completed');
      setActiveCall(res.data.data);
      cleanupMedia();
      const hist = await emergencyService.getHistory();
      setCallHistory(hist.data?.data || []);
      success('Emergency Call Ended', 'Call has been logged to Emergency History.');
    } catch {
      cleanupMedia();
      setActiveCall(null);
    }
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Emergency Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center animate-pulse">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                Emergency Live Video Assistance
                <span className="text-[11px] bg-white/20 px-2.5 py-0.5 rounded-full font-semibold uppercase">
                  24/7 Priority Dispatch
                </span>
              </h2>
              <p className="text-xs text-red-100">
                Real-time WebRTC Doctor-Patient Video Call with Automatic Doctor Failover
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'call' ? 'history' : 'call')}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold inline-flex items-center gap-1.5 transition"
            >
              <History className="h-3.5 w-3.5" />
              {activeTab === 'call' ? `Call History (${callHistory.length})` : 'Back to Live Call'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'history' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="h-4 w-4 text-red-600" /> Emergency Call History Log
                </h3>
                <span className="text-xs text-slate-500">{callHistory.length} total records</span>
              </div>

              {callHistory.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                  <PhoneCall className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">No emergency calls recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {callHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">
                            Patient: {item.patientName}
                          </span>
                          <span className="text-xs text-slate-400">→</span>
                          <span className="font-semibold text-sm text-sky-700 dark:text-sky-400">
                            {item.assignedDoctorName} ({item.assignedDoctorSpecialization})
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              item.status === 'COMPLETED' || item.status === 'ACCEPTED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <strong>Reason:</strong> {item.reason}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Initiated: {formatDateTime(item.createdAt)}
                          {item.reassignmentCount > 0 && ` · Auto-reassigned ${item.reassignmentCount} time(s)`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !activeCall || activeCall.status === 'COMPLETED' ? (
            /* Step 1: Initiate Emergency Request (for Patient) or Standby (for Doctor) */
            role === 'PATIENT' ? (
              <div className="space-y-5 py-4">
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-red-900 space-y-1">
                    <p className="font-bold text-sm">Immediate Doctor Video Dispatch</p>
                    <p>
                      Clicking <strong>Start Emergency Video Call</strong> will immediately alert an available doctor with your medical profile, allergies, and chronic conditions. If the first doctor does not respond within 20 seconds, the system automatically reassigns your call to the next available doctor.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Brief Emergency Description (Optional)
                  </label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Sudden chest pain, severe breathlessness, high fever..."
                    className="h-11"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRequestEmergency}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 h-11 shadow-md"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    {isLoading ? 'Dispatching Emergency Alert...' : 'Start Emergency Video Call Now'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Active Emergency Calls Right Now
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You will automatically see an incoming emergency alert with live audio/visual notification whenever a patient triggers an SOS video call.
                </p>
              </div>
            )
          ) : activeCall.status === 'RINGING' ? (
            /* Step 2: Ringing & Auto-Reassignment State */
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-5">
              <div className="h-16 w-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto animate-bounce">
                <PhoneCall className="h-8 w-8" />
              </div>

              {role === 'PATIENT' ? (
                <>
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      <Clock className="h-3.5 w-3.5" /> Auto-reassigns in {reassignTimer}s if unanswered
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white pt-2">
                      Calling {activeCall.assignedDoctorName}
                    </h3>
                    <p className="text-sm text-sky-600 font-medium">
                      {activeCall.assignedDoctorSpecialization}
                    </p>
                    {activeCall.reassignmentCount > 0 && (
                      <p className="text-xs text-amber-600 font-medium">
                        Auto-reassigned {activeCall.reassignmentCount} time(s) to find an available doctor
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleReassignCall}
                      disabled={isLoading}
                      className="border-amber-300 text-amber-800 hover:bg-amber-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Switch to Another Doctor Now
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleEndCall}
                    >
                      <PhoneOff className="h-4 w-4 mr-2" /> Cancel Emergency Call
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      🚨 INCOMING PATIENT EMERGENCY · Auto-reassigns in {reassignTimer}s
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Patient: {activeCall.patientName}
                      {activeCall.patientAge ? ` (${activeCall.patientAge} yrs)` : ''}
                    </h3>
                    <p className="text-sm font-medium text-red-600">
                      Reason: &ldquo;{activeCall.reason}&rdquo;
                    </p>
                  </div>

                  {/* Patient critical medical profile preview for Doctor */}
                  <div className="max-w-lg mx-auto p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1.5">
                    <p>
                      <strong>Blood Group:</strong>{' '}
                      {activeCall.patientBloodGroup?.replace('_', ' ') || 'Not specified'}
                    </p>
                    <p>
                      <strong>Allergies:</strong>{' '}
                      {activeCall.patientAllergies?.length
                        ? activeCall.patientAllergies.join(', ')
                        : 'None recorded'}
                    </p>
                    <p>
                      <strong>Chronic Conditions:</strong>{' '}
                      {activeCall.patientChronicDiseases?.length
                        ? activeCall.patientChronicDiseases.join(', ')
                        : 'None recorded'}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                      onClick={handleAcceptCall}
                      disabled={isLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 h-11"
                    >
                      <Video className="h-4 w-4 mr-2" /> Accept & Start Live Video
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReassignCall}
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" /> Unavailable (Reassign to Next Doctor)
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Step 3: ACCEPTED — Live WebRTC Video Call Interface */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 rounded-xl">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    Connected: {activeCall.patientName} &amp; {activeCall.assignedDoctorName} (
                    {activeCall.assignedDoctorSpecialization})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    LIVE {formatSeconds(callDuration)}
                  </span>
                </div>
              </div>

              {/* Dual Video Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Remote Video Feed */}
                <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video border border-slate-800 flex items-center justify-center">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!peerConnected && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-4 text-center">
                      <div className="h-14 w-14 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center mb-3 animate-pulse">
                        <Video className="h-6 w-6 text-sky-400" />
                      </div>
                      <p className="text-sm font-semibold">
                        {role === 'PATIENT' ? activeCall.assignedDoctorName : activeCall.patientName}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Live encrypted video/audio channel active
                      </p>
                    </div>
                  )}
                  <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-md font-medium">
                    {role === 'PATIENT' ? activeCall.assignedDoctorName : activeCall.patientName}
                  </span>
                </div>

                {/* Local Video Feed */}
                <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video border border-slate-800 flex items-center justify-center">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isVideoOff && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-white">
                      <VideoOff className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-400">Camera Off</p>
                    </div>
                  )}
                  <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-md font-medium">
                    You ({user?.firstName})
                  </span>
                </div>
              </div>

              {/* Call Controls Bar */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant={isMuted ? 'destructive' : 'outline'}
                  onClick={toggleMute}
                  className="rounded-full h-11 px-5"
                >
                  {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                  {isMuted ? 'Unmute Mic' : 'Mute Mic'}
                </Button>

                <Button
                  type="button"
                  variant={isVideoOff ? 'destructive' : 'outline'}
                  onClick={toggleVideo}
                  className="rounded-full h-11 px-5"
                >
                  {isVideoOff ? (
                    <VideoOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Video className="h-4 w-4 mr-2" />
                  )}
                  {isVideoOff ? 'Start Camera' : 'Stop Camera'}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleEndCall}
                  className="rounded-full h-11 px-6 font-semibold shadow-md"
                >
                  <PhoneOff className="h-4 w-4 mr-2" /> End Emergency Call
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
