import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Send,
  RefreshCw,
  X,
  ShieldCheck,
  Terminal,
  Settings
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export const NotificationModal: React.FC = () => {
  const {
    isModalOpen,
    closeModal,
    fcmState,
    fcmToken,
    permissionStatus,
    isIframe,
    error,
    isLoading,
    diagnosticLogs,
    requestPermission,
    sendTestNotification,
    recheckPermission,
    saveVapidKey,
    clearToken
  } = useNotification();

  const [copied, setCopied] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [manualVapid, setManualVapid] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  if (!isModalOpen) return null;

  const handleCopyToken = () => {
    if (!fcmToken) return;
    navigator.clipboard.writeText(fcmToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendTest = async () => {
    setTestSending(true);
    setTestFeedback(null);
    const res = await sendTestNotification();
    setTestFeedback(res);
    setTestSending(false);
  };

  const handleSaveManualVapid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualVapid.trim()) return;
    await saveVapidKey(manualVapid.trim());
    setManualVapid('');
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  // Determine which UI state card to emphasize
  // 1: enabled, 2: denied, 3: unsupported, 4: config_missing
  const effectiveState =
    fcmState === 'enabled'
      ? 'enabled'
      : fcmState === 'denied' || permissionStatus === 'denied'
      ? 'denied'
      : fcmState === 'unsupported' || isIframe || permissionStatus === 'unsupported'
      ? 'unsupported'
      : 'config_missing';

  return (
    <div
      id="fcm-notification-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        id="fcm-notification-modal"
        className="bg-[#19130F] border border-[#C9A45C]/40 text-[#F7F0E3] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#C9A45C]/20 flex items-center justify-between bg-[#241A13]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#C9A45C]/15 border border-[#C9A45C]/30 rounded-xl text-[#C9A45C]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-cinzel font-bold text-[#E5CB91] flex items-center gap-2">
                Push Notification Center
              </h3>
              <p className="text-[11px] text-[#A69784]">
                Firebase Cloud Messaging (FCM) Web Push Service
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 text-[#A69784] hover:text-[#F7F0E3] hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Badge Strip */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#120D0A] rounded-xl border border-[#33251B] text-xs">
            <span className="text-[#A69784]">System Status:</span>
            {effectiveState === 'enabled' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Notifications Enabled
              </span>
            )}
            {effectiveState === 'denied' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-950 text-red-300 border border-red-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Permission Denied
              </span>
            )}
            {effectiveState === 'unsupported' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Browser Not Supported / Iframe
              </span>
            )}
            {effectiveState === 'config_missing' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-950 text-yellow-300 border border-yellow-700/60">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                FCM Setup Missing
              </span>
            )}
          </div>

          {/* STATE 1: Notifications Enabled */}
          {effectiveState === 'enabled' && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-600/40 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">
                    Notifications Enabled & Connected
                  </h4>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    Your browser has granted notification permissions and this device is registered with Firebase Cloud Messaging. Background push notifications will be delivered when your order status updates.
                  </p>
                </div>
              </div>

              {/* FCM Device Token Preview */}
              {fcmToken && (
                <div className="bg-[#120D0A] border border-[#33251B] p-3 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#A69784] font-medium">Device FCM Registration Token:</span>
                    <button
                      onClick={handleCopyToken}
                      className="text-[#C9A45C] hover:text-[#E5CB91] flex items-center gap-1 text-[10px] font-semibold"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy Full Token
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-[#F7F0E3]/75 break-all bg-black/40 p-2 rounded border border-[#241A13]">
                    {fcmToken.length > 80 ? `${fcmToken.substring(0, 40)}...${fcmToken.substring(fcmToken.length - 35)}` : fcmToken}
                  </p>
                </div>
              )}

              {/* Test Notification Trigger */}
              <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                <button
                  id="send-test-push-btn"
                  onClick={handleSendTest}
                  disabled={testSending}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {testSending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Dispatching Test Alert...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Live Test Push to This Device
                    </>
                  )}
                </button>

                <button
                  onClick={clearToken}
                  className="text-xs text-[#A69784] hover:text-red-400 underline px-2 py-1 ml-auto"
                >
                  Clear Device Token
                </button>
              </div>

              {testFeedback && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    testFeedback.success
                      ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-700/50'
                      : 'bg-red-900/40 text-red-200 border border-red-700/50'
                  }`}
                >
                  {testFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{testFeedback.message}</span>
                </div>
              )}
            </div>
          )}

          {/* STATE 2: Permission Denied */}
          {effectiveState === 'denied' && (
            <div className="p-4 rounded-xl bg-red-950/25 border border-red-600/40 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/20 text-red-400 rounded-lg shrink-0 mt-0.5">
                  <BellOff className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-300">
                    Browser Notification Permission Denied
                  </h4>
                  <p className="text-xs text-red-200/80 mt-1">
                    Your browser has blocked push notifications for this site. In accordance with web browser security policies, notification prompts cannot appear automatically once blocked.
                  </p>
                </div>
              </div>

              <div className="bg-[#120D0A] border border-[#33251B] p-3 rounded-lg space-y-2 text-xs">
                <p className="font-semibold text-[#E5CB91] flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" /> How to re-enable notifications:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[#F7F0E3]/85 text-[11px]">
                  <li>
                    Look at your browser's address bar (URL) at the top of this window.
                  </li>
                  <li>
                    Click the <strong>Tune / Site Settings</strong> or <strong>Padlock</strong> icon to the left of the URL.
                  </li>
                  <li>
                    Find <strong>Notifications</strong> and change it from <em>Block</em> to <strong>Allow</strong>.
                  </li>
                  <li>Click the button below to verify and complete registration.</li>
                </ol>
              </div>

              <button
                id="recheck-permission-btn"
                onClick={recheckPermission}
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Check Permission Again
              </button>
            </div>
          )}

          {/* STATE 3: Browser does not support notifications */}
          {effectiveState === 'unsupported' && (
            <div className="p-4 rounded-xl bg-amber-950/25 border border-amber-600/40 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-300">
                    {isIframe
                      ? 'Browser Restriction: Embedded Preview Frame'
                      : 'Push Notifications Not Supported'}
                  </h4>
                  <p className="text-xs text-amber-200/80 mt-1">
                    {isIframe
                      ? 'Modern web browsers (Chrome, Edge, Safari) strictly prohibit notification permission dialogs from inside embedded iframes. To allow push notifications and test real device alerts, please open this app in a standalone tab.'
                      : 'Your current browser or environment does not support the Web Notification or Service Worker APIs required for Firebase Cloud Messaging.'}
                  </p>
                </div>
              </div>

              {isIframe && (
                <div className="bg-[#120D0A] border border-[#33251B] p-3 rounded-lg space-y-2">
                  <p className="text-xs text-[#F7F0E3]/90">
                    Click below to open the application in a direct browser tab where Notification permissions can be prompted:
                  </p>
                  <button
                    id="open-in-new-tab-btn"
                    onClick={openInNewTab}
                    className="w-full py-2.5 bg-[#C9A45C] hover:bg-[#b9944c] text-[#19130F] font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open App in New Tab to Enable
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STATE 4: Firebase/FCM configuration missing */}
          {effectiveState === 'config_missing' && (
            <div className="p-4 rounded-xl bg-yellow-950/25 border border-yellow-600/40 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-yellow-300">
                    Firebase Cloud Messaging Web Push Certificate Required
                  </h4>
                  <p className="text-xs text-yellow-200/80 mt-1">
                    Browser notification permission is ready, but Firebase Cloud Messaging requires a <strong>Web Push Certificate (VAPID Key)</strong> to subscribe the service worker and generate device tokens.
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-[#120D0A] border border-[#33251B] p-3.5 rounded-lg space-y-2 text-xs">
                <p className="font-semibold text-[#E5CB91]">
                  Required Firebase Console Settings:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[#F7F0E3]/85 text-[11px]">
                  <li>
                    Open the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-[#C9A45C] underline font-semibold">Firebase Console</a> for project <code>gen-lang-client-0150006932</code>.
                  </li>
                  <li>
                    Click the <strong>Project settings</strong> gear icon in the left sidebar, then select the <strong>Cloud Messaging</strong> tab.
                  </li>
                  <li>
                    Scroll down to the <strong>Web configuration</strong> section.
                  </li>
                  <li>
                    Under <strong>Web Push certificates</strong>, click <strong>Generate Key Pair</strong>.
                  </li>
                  <li>
                    Copy the generated Public Key string and save it to <code>.env</code> as:
                    <pre className="mt-1 p-2 bg-black/60 rounded text-[10px] text-[#C9A45C] font-mono overflow-x-auto border border-[#241A13]">
                      VITE_FIREBASE_VAPID_KEY=BN_YOUR_KEY_PAIR_HERE...
                    </pre>
                  </li>
                </ol>
              </div>

              {/* Manual Input for Instant Activation */}
              <form onSubmit={handleSaveManualVapid} className="space-y-2">
                <label className="block text-[11px] font-semibold text-[#A69784]">
                  Or paste your generated VAPID Key here for instant test activation:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualVapid}
                    onChange={(e) => setManualVapid(e.target.value)}
                    placeholder="e.g. BC5W_..."
                    className="flex-1 bg-[#120D0A] border border-[#33251B] text-[#F7F0E3] px-3 py-2 rounded-lg text-xs font-mono focus:outline-none focus:border-[#C9A45C]"
                  />
                  <button
                    type="submit"
                    disabled={!manualVapid.trim() || isLoading}
                    className="px-4 py-2 bg-[#C9A45C] hover:bg-[#b9944c] text-[#19130F] font-bold text-xs uppercase tracking-wider rounded-lg shrink-0 transition-colors disabled:opacity-50"
                  >
                    Activate Token
                  </button>
                </div>
              </form>

              <button
                id="retry-request-permission-btn"
                onClick={() => requestPermission()}
                disabled={isLoading}
                className="w-full py-2 bg-[#241A13] hover:bg-[#33251B] text-[#E5CB91] border border-[#C9A45C]/40 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Requesting Token...' : 'Retry Token Generation'}
              </button>
            </div>
          )}

          {/* Diagnostic Console Accordion */}
          <div className="border border-[#33251B] rounded-xl overflow-hidden bg-[#120D0A]">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="w-full p-3 text-left text-xs font-semibold text-[#A69784] hover:text-[#F7F0E3] flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#C9A45C]" />
                Live FCM Diagnostic Logs ({diagnosticLogs.length})
              </span>
              <span className="text-[10px] text-[#C9A45C]">
                {showLogs ? 'Hide Logs ▲' : 'Show Logs ▼'}
              </span>
            </button>

            {showLogs && (
              <div className="p-3 border-t border-[#33251B] space-y-1 max-h-48 overflow-y-auto font-mono text-[10px]">
                {diagnosticLogs.length === 0 ? (
                  <p className="text-[#806F5D] italic">No logs recorded yet. Click Enable Notifications to start.</p>
                ) : (
                  diagnosticLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`leading-relaxed ${
                        log.level === 'error'
                          ? 'text-red-400'
                          : log.level === 'warn'
                          ? 'text-yellow-400'
                          : log.level === 'success'
                          ? 'text-emerald-400'
                          : 'text-[#C9A45C]/90'
                      }`}
                    >
                      <span className="text-[#806F5D]">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#C9A45C]/20 bg-[#241A13] flex items-center justify-between">
          <div className="text-[11px] text-[#A69784] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C9A45C]" />
            Encrypted Device Push Stream
          </div>
          <button
            onClick={closeModal}
            className="px-4 py-1.5 bg-[#120D0A] hover:bg-[#19130F] border border-[#C9A45C]/30 text-[#E5CB91] font-medium text-xs rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
