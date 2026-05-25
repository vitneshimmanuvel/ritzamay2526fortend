import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Sparkles, Loader2, Plus, History, MessageSquare, ChevronRight, Mail, Lock, UserIcon, AlertCircle, Phone, X, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function Chat() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [visibleCards, setVisibleCards] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Inline registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCountryCode, setRegCountryCode] = useState('+91');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Availability state
  const [emailTaken, setEmailTaken] = useState(false);
  const [phoneTaken, setPhoneTaken] = useState(false);

  // Check email availability on debounce
  useEffect(() => {
    if (!regEmail.trim()) {
      setEmailTaken(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) {
      setEmailTaken(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/auth/check-availability', { email: regEmail });
        setEmailTaken(res.data.emailTaken);
      } catch (err) {
        console.error("Availability check failed", err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [regEmail]);

  // Check phone availability on debounce
  useEffect(() => {
    if (regPhone.length < 10) {
      setPhoneTaken(false);
      return;
    }
    const fullPhone = `${regCountryCode}${regPhone}`;
    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/auth/check-availability', { phoneNumber: fullPhone });
        setPhoneTaken(res.data.phoneTaken);
      } catch (err) {
        console.error("Availability check failed", err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [regPhone, regCountryCode]);

  const [freeAnswersCount, setFreeAnswersCount] = useState(() => {
    return parseInt(localStorage.getItem('freeAnswersCount') || '0', 10);
  });

  const user = useStore((state) => state.user);
  const messages = useStore((state) => state.messages);
  const options = useStore((state) => state.options);
  const addMessage = useStore((state) => state.addMessage);
  const setMessages = useStore((state) => state.setMessages);
  const setOptions = useStore((state) => state.setOptions);
  const currentSessionId = useStore((state) => state.currentSessionId);
  const setCurrentSessionId = useStore((state) => state.setCurrentSessionId);
  const chatSessions = useStore((state) => state.chatSessions);
  const setChatSessions = useStore((state) => state.setChatSessions);
  const clearChat = useStore((state) => state.clearChat);
  const setUser = useStore((state) => state.setUser);
  const pendingOption = useStore((state) => state.pendingOption);
  const setPendingOption = useStore((state) => state.setPendingOption);
  const showInlineRegister = useStore((state) => state.showInlineRegister);
  const setShowInlineRegister = useStore((state) => state.setShowInlineRegister);

  // Load chat sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await api.get('/chat/sessions');
        setChatSessions(res.data.sessions || []);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setLoadingSessions(false);
      }
    };
    loadSessions();
  }, [setChatSessions]);

  // Auto-scroll to bottom dynamically as cards render
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
    return () => clearTimeout(timer);
  }, [messages, options, showInlineRegister, visibleCards]);

  // Staggered card animation
  useEffect(() => {
    if (options.length > 0) {
      setVisibleCards(0);
      const timers: NodeJS.Timeout[] = [];
      options.forEach((_, idx) => {
        timers.push(setTimeout(() => {
          setVisibleCards(prev => prev + 1);
        }, (idx + 1) * 150));
      });
      return () => timers.forEach(clearTimeout);
    } else {
      setVisibleCards(0);
    }
  }, [options]);

  // After login/register, if there's a pending option, continue the chat
  useEffect(() => {
    if (user && pendingOption) {
      setShowInlineRegister(false);
      handleOptionClick(pendingOption.id, pendingOption.text, true);
      setPendingOption(null);
    }
  }, [user]);

  // Load a specific session's messages
  const loadSession = async (sessionId: string) => {
    setLoading(true);
    setOptions([]);
    setIsInputReleased(false);
    try {
      const res = await api.get(`/chat/session/${sessionId}`);
      const msgs = (res.data.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        optionClicked: m.optionClicked,
      }));
      setMessages(msgs);
      setCurrentSessionId(sessionId);
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    clearChat();
    setIsInputReleased(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const query = input;
    addMessage({ id: Date.now().toString(), role: 'user', content: query });
    setInput('');
    setLoading(true);
    setOptions([]);
    setIsInputReleased(false);

    try {
      const res = await api.post('/chat/options', { query, sessionId: currentSessionId });
      setOptions(res.data.options || []);
      
      if (res.data.sessionId && res.data.sessionId !== currentSessionId) {
        setCurrentSessionId(res.data.sessionId);
        const sessRes = await api.get('/chat/sessions');
        setChatSessions(sessRes.data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch options", error);
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I had trouble processing that. Please try again! 😊"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = async (optionId: string, text: string, skipAuth = false) => {
    // Check if user needs to register (after first option click for anonymous users)
    if (!user && !skipAuth && freeAnswersCount >= 1) {
      setPendingOption({ id: optionId, text });
      setShowInlineRegister(true);
      return;
    }

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const query = lastUserMsg?.content || "Unknown query";
    setOptions([]);
    setIsInputReleased(false);
    addMessage({ id: Date.now().toString(), role: 'user', content: text, optionClicked: optionId });
    setLoading(true);

    try {
      const res = await api.post('/chat/answer', { query, selectedOption: text, sessionId: currentSessionId });
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.answer
      });

      // Automatically store the next follow-up options generated by the backend
      setOptions(res.data.options || []);

      if (res.data.sessionId && res.data.sessionId !== currentSessionId) {
        setCurrentSessionId(res.data.sessionId);
        try {
          const sessRes = await api.get('/chat/sessions');
          setChatSessions(sessRes.data.sessions || []);
        } catch (err) {
          console.error("Failed to refresh sessions list:", err);
        }
      }
      
      if (!user) {
        const newCount = freeAnswersCount + 1;
        setFreeAnswersCount(newCount);
        localStorage.setItem('freeAnswersCount', newCount.toString());
      }
    } catch (error) {
      console.error("Failed to fetch answer", error);
      addMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: "Oops! Something went wrong. Let me try again... 😅" });
    } finally {
      setLoading(false);
    }
  };

  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailTaken) {
      setRegError('This email is already in use.');
      return;
    }
    if (phoneTaken) {
      setRegError('This phone number is already in use.');
      return;
    }
    if (regPhone && regPhone.length !== 10) {
      setRegError('Phone number must be exactly 10 digits.');
      return;
    }

    setRegLoading(true);
    setRegError('');

    try {
      const fullPhone = regPhone ? `${regCountryCode}${regPhone}` : null;
      const res = await api.post('/auth/register', {
        name: regName,
        email: regEmail,
        phoneNumber: fullPhone,
        password: regPassword,
      });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      // The useEffect watching `user` will pick up the pending option and continue
    } catch (err: any) {
      setRegError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError('');

    try {
      const res = await api.post('/auth/login', {
        email: regEmail,
        password: regPassword,
      });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
    } catch (err: any) {
      setRegError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const [isLoginMode, setIsLoginMode] = useState(false);
  const [isInputReleased, setIsInputReleased] = useState(false);

  return (
    <div className="flex h-full">
      {/* Chat History Sidebar */}
      <div className="w-72 border-r border-gray-200/50 bg-gray-50 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-200/50">
          <Button
            onClick={handleNewChat}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-medium h-10 rounded-xl shadow-md shadow-red-900/20 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <History className="w-3.5 h-3.5" />
            Recent Conversations
          </div>
          
          {loadingSessions ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No conversations yet</p>
            </div>
          ) : (
            chatSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => loadSession(session.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                  currentSessionId === session.id
                    ? 'bg-red-500/10 text-red-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <MessageSquare className={`w-4 h-4 shrink-0 ${currentSessionId === session.id ? 'text-red-500' : 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate font-medium">
                    {session.summary || 'New conversation'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(session.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${currentSessionId === session.id ? 'opacity-100 text-red-500' : ''}`} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 mt-10">
              <div className="relative">
                <img 
                  src="/ritza.png" 
                  alt="Ritza" 
                  className="w-24 h-24 rounded-full border-4 border-red-100 shadow-xl object-cover"
                />
                <div className="absolute -bottom-1 -right-1 bg-green-400 w-5 h-5 rounded-full border-2 border-white"></div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Hi! I'm Ritza 👋</h2>
              <p className="text-gray-500 max-w-md leading-relaxed">
                I'm your AI assistant. Ask me anything and I'll help you find the best answers from our knowledge base!
              </p>
              {user && (
                <p className="text-xs text-gray-400 mt-2">
                  Welcome back, <span className="text-red-500 font-medium">{user.name}</span>! Your conversations are saved automatically.
                </p>
              )}
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md overflow-hidden ${
                  msg.role === 'user' ? 'bg-red-600' : 'border-2 border-red-100'
                }`}>
                  {msg.role === 'user' 
                    ? <User className="w-5 h-5 text-white" /> 
                    : <img src="/ritza.png" alt="Ritza" className="w-full h-full object-cover" />
                  }
                </div>
                {/* Message bubble */}
                <div className={`max-w-[70%] rounded-2xl px-5 py-3.5 text-sm md:text-base ${
                  msg.role === 'user'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 border border-gray-200 leading-relaxed shadow-sm whitespace-pre-wrap'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {/* Loading / Thinking state */}
          {loading && (
            <div className="flex gap-3 animate-in fade-in duration-300">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md overflow-hidden border-2 border-red-100 relative">
                <img src="/ritza.png" alt="Ritza" className="w-full h-full object-cover" />
                {/* Pulsing ring */}
                <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-40"></div>
              </div>
              <div className="bg-gray-50 rounded-2xl px-5 py-3.5 text-sm text-gray-500 border border-gray-200 shadow-sm flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                </div>
                <span>Ritza is thinking...</span>
              </div>
            </div>
          )}

          {/* Option Cards */}
          {options.length > 0 && !loading && (
            <div className="animate-in fade-in duration-300">
              {messages.length <= 1 && (
                <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md overflow-hidden border-2 border-red-100">
                    <img src="/ritza.png" alt="Ritza" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-gray-50 rounded-2xl px-5 py-3.5 text-sm text-gray-600 border border-gray-200 shadow-sm leading-relaxed">
                    <span>Hey {user ? user.name : 'there'}! I'm Ritza, your friendly B2C travel & immigration assistant. I'm so excited to help you plan your exciting journey! 🌟 Let's start by choosing what you'd like to explore:</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-[52px] pr-4">
                {options.map((opt, idx) => (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionClick(opt.id, opt.text)}
                    className={`group relative bg-white border border-gray-200 rounded-2xl p-4 text-left transition-all duration-300 hover:border-red-300 hover:shadow-lg hover:shadow-red-100/50 hover:-translate-y-0.5 active:scale-[0.98] ${
                      idx < visibleCards 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transition: 'opacity 0.3s ease, transform 0.3s ease, border-color 0.2s, box-shadow 0.2s' }}
                  >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">
                      {opt.emoji || '💬'}
                    </div>
                    <p className="text-sm text-gray-700 font-medium leading-snug group-hover:text-red-600 transition-colors">
                      {opt.text}
                    </p>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4 text-red-400" />
                    </div>
                  </button>
                ))}

                {/* "Other: Ask a custom question" Card */}
                <button
                  onClick={() => {
                    setIsInputReleased(true);
                    setTimeout(() => inputRef.current?.focus(), 80);
                  }}
                  className={`group relative border-2 rounded-2xl p-4 text-left transition-all duration-300 active:scale-[0.98] ${
                    isInputReleased 
                      ? 'border-red-500 bg-red-50/30 shadow-md shadow-red-100/30' 
                      : 'bg-gray-50 border-dashed border-gray-200 hover:border-red-300 hover:bg-white hover:shadow-lg hover:-translate-y-0.5'
                  } ${
                    visibleCards >= options.length 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transition: 'opacity 0.3s ease, transform 0.3s ease, border-color 0.2s, box-shadow 0.2s' }}
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">
                    💬
                  </div>
                  <p className="text-sm text-gray-700 font-semibold leading-snug group-hover:text-red-600 transition-colors">
                    Other: Ask a custom question...
                  </p>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-red-400" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Registration Popup Modal */}
          {showInlineRegister && !user && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              {/* Modal Card */}
              <div className="relative bg-white border-2 border-red-100 rounded-2xl p-6 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowInlineRegister(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-4 pr-8">
                  <img src="/ritza.png" alt="Ritza" className="w-10 h-10 rounded-full border-2 border-red-100 object-cover" />
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {isLoginMode ? 'Welcome back!' : 'Quick sign up to continue! 🎉'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {isLoginMode ? 'Sign in to pick up where you left off' : "It only takes a few seconds — I'll wait right here!"}
                    </p>
                  </div>
                </div>

                {regError && (
                  <div className="flex items-center gap-2 text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-xl text-xs mb-3 animate-in fade-in duration-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={isLoginMode ? handleInlineLogin : handleInlineRegister} className="space-y-3">
                  {!isLoginMode && (
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Your name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                        className="w-full h-10 pl-10 pr-4 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        className="w-full h-10 pl-10 pr-4 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    {!isLoginMode && emailTaken && (
                      <p className="text-[10px] text-red-500 font-semibold px-2 animate-in fade-in duration-200">
                        ❌ This email is already registered
                      </p>
                    )}
                  </div>
                  {!isLoginMode && (
                    <div className="space-y-1">
                      <div className="flex gap-2 relative">
                        <div className="relative w-24 shrink-0">
                          <select
                            value={regCountryCode}
                            onChange={(e) => setRegCountryCode(e.target.value)}
                            className="w-full h-10 pl-2 pr-4 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-800 appearance-none font-medium cursor-pointer"
                            style={{
                              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
                              backgroundPosition: 'right 0.25rem center',
                              backgroundSize: '1.25em 1.25em',
                              backgroundRepeat: 'no-repeat',
                            }}
                          >
                            <option value="+91">+91 (IN)</option>
                            <option value="+1">+1 (US)</option>
                            <option value="+44">+44 (UK)</option>
                            <option value="+971">+971 (AE)</option>
                            <option value="+61">+61 (AU)</option>
                            <option value="+65">+65 (SG)</option>
                            <option value="+81">+81 (JP)</option>
                            <option value="+33">+33 (FR)</option>
                            <option value="+49">+49 (DE)</option>
                          </select>
                        </div>
                        <div className="relative flex-1">
                          <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            placeholder="10-digit number"
                            value={regPhone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                              setRegPhone(val);
                            }}
                            required
                            pattern="[0-9]{10}"
                            className="w-full h-10 pl-10 pr-4 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                      {phoneTaken && (
                        <p className="text-[10px] text-red-500 font-semibold px-2 animate-in fade-in duration-200">
                          ❌ This phone number is already registered
                        </p>
                      )}
                    </div>
                  )}
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (min 6 chars)"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full h-10 pl-10 pr-10 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button type="submit" disabled={regLoading} className="w-full h-10 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors shadow-md shadow-red-900/10">
                    {regLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLoginMode ? 'Sign In' : 'Create Account & Continue')}
                  </Button>
                </form>

                <p className="text-xs text-gray-400 text-center mt-3">
                  {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
                  <button onClick={() => { setIsLoginMode(!isLoginMode); setRegError(''); }} className="text-red-500 hover:text-red-400 font-medium">
                    {isLoginMode ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Dynamic Spacer to ensure cards/messages never get cut off by the absolute input panel */}
          <div className={options.length > 0 ? "h-56" : "h-24"} />
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 pointer-events-none">
          <div className="max-w-4xl mx-auto space-y-3 pointer-events-auto">
            <form onSubmit={handleSend} className="relative flex items-center group">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Ritza anything..."
                disabled={(!isInputReleased && options.length > 0) || loading || showInlineRegister}
                className="w-full bg-gray-50 border-gray-200 text-gray-900 h-14 pl-6 pr-16 rounded-2xl focus-visible:ring-red-500 shadow-sm placeholder:text-gray-400 text-base transition-all group-hover:border-gray-300 disabled:opacity-50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || (!isInputReleased && options.length > 0) || loading || showInlineRegister}
                className="absolute right-3 h-9 w-9 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-30 disabled:hover:bg-red-600 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <div className="text-center text-xs text-gray-400 font-medium">
              Powered by Ritza AI · Responses are based on our knowledge base
              {!user && ` · ${Math.max(0, 1 - freeAnswersCount)} free answer${freeAnswersCount === 0 ? '' : 's'} remaining`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
