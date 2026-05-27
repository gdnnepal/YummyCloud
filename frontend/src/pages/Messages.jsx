import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineChatBubbleLeft,
  HiOutlineTicket,
  HiOutlineExclamationCircle,
  HiOutlineMegaphone,
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import TopNav from '../components/TopNav';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

const typeIcons = {
  info: { icon: HiOutlineInformationCircle, bg: 'bg-blue-50', color: 'text-blue-500' },
  coupon: { icon: HiOutlineTicket, bg: 'bg-green-50', color: 'text-green-500' },
  apology: { icon: HiOutlineExclamationCircle, bg: 'bg-amber-50', color: 'text-amber-500' },
  promotion: { icon: HiOutlineMegaphone, bg: 'bg-purple-50', color: 'text-purple-500' },
  system: { icon: HiOutlineInformationCircle, bg: 'bg-gray-100', color: 'text-gray-500' },
};

function Messages() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchMessages();
  }, [isAuthenticated]);

  const fetchMessages = async () => {
    try {
      const res = await api.getMessages();
      setMessages(res.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.markMessageRead(id);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenMessage = (msg) => {
    setSelectedMessage(msg);
    if (!msg.is_read) {
      handleMarkRead(msg.id);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllMessagesRead();
      setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  if (!isAuthenticated) {
    return (
      <>
        <TopNav title="Messages" showBack={true} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <HiOutlineChatBubbleLeft className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Login to view messages</p>
          <Link to="/login" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm">
            {t('login')}
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="pb-4">
      <TopNav
        title="Messages"
        showBack={true}
        rightAction={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
              title="Mark all as read"
            >
              <HiOutlineCheckCircle className="w-5 h-5 text-primary" />
            </button>
          ) : null
        }
      />

      {loading ? (
        <div className="px-4 pt-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-20 animate-pulse" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <HiOutlineChatBubbleLeftEllipsis className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No messages yet</p>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-2">
          {messages.map((msg) => {
            const typeStyle = typeIcons[msg.type] || typeIcons.info;
            const Icon = typeStyle.icon;

            return (
              <div
                key={msg.id}
                onClick={() => handleOpenMessage(msg)}
                className={`bg-white rounded-2xl p-4 shadow-sm border transition-colors cursor-pointer ${
                  msg.is_read ? 'border-gray-100' : 'border-primary/20 bg-red-50/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeStyle.bg}`}>
                    <Icon className={`w-5 h-5 ${typeStyle.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-semibold text-gray-800 truncate ${!msg.is_read ? 'font-bold' : ''}`}>
                        {msg.title}
                      </h3>
                      {!msg.is_read && (
                        <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{msg.body}</p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {new Date(msg.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Message Detail Popup */}
      {selectedMessage && (() => {
        const typeStyle = typeIcons[selectedMessage.type] || typeIcons.info;
        const Icon = typeStyle.icon;
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-5">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedMessage(null)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up max-h-[80vh] overflow-y-auto">
              {/* Icon & Type */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${typeStyle.bg}`}>
                  <Icon className={`w-5 h-5 ${typeStyle.color}`} />
                </div>
                <div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${typeStyle.color}`}>
                    {selectedMessage.type}
                  </span>
                  <p className="text-[10px] text-gray-400">
                    {new Date(selectedMessage.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-800 mb-2">{selectedMessage.title}</h3>

              {/* Body */}
              <p className="text-sm text-gray-600 leading-relaxed">{selectedMessage.body}</p>

              {/* Close */}
              <button
                onClick={() => setSelectedMessage(null)}
                className="w-full mt-5 py-2.5 rounded-lg text-sm font-medium text-white bg-primary active:scale-95 transition-transform"
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default Messages;
