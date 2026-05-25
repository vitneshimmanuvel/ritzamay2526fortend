import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Sparkles, UserCheck, MessageSquare, X, Calendar, User, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from '../../lib/api';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  phoneNumber: string | null;
  createdAt: string;
  _count?: {
    messages: number;
    sessions: number;
  };
}

export default function UsersList() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Session viewer state
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [userSessions, setUserSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data.users || []);
      } catch (err) {
        console.error("Failed to load users:", err);
        setError('Failed to fetch registered users list.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleViewSessions = async (u: UserItem) => {
    setSelectedUser(u);
    setSessionsLoading(true);
    setUserSessions([]);
    setSelectedSessionId(null);
    try {
      const res = await api.get(`/admin/users/${u.id}/sessions`);
      const sessions = res.data.sessions || [];
      setUserSessions(sessions);
      if (sessions.length > 0) {
        setSelectedSessionId(sessions[0].id);
      }
    } catch (err) {
      console.error("Failed to load user sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(search.toLowerCase())) ||
    (u.phoneNumber && u.phoneNumber.includes(search))
  );

  // Sort users so those with more messages are displayed first (showing who used it more!)
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aMessages = a._count?.messages || 0;
    const bMessages = b._count?.messages || 0;
    return bMessages - aMessages;
  });

  const selectedSession = userSessions.find(s => s.id === selectedSessionId);

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto relative">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          Users Management <Sparkles className="w-6 h-6 text-red-400" />
        </h1>
        <p className="text-gray-600 mt-2">Manage user access privileges, view usage metrics, and inspect chat history.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input 
            placeholder="Search users by name, email, department, or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-50/50 border-gray-200 text-gray-900 focus-visible:ring-red-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <Card className="bg-gray-50/50 border-gray-200 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">Registered Users</CardTitle>
          <CardDescription className="text-gray-500">All registered users with system access, ordered by usage activity.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No users match your query.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedUsers.map((u) => (
                <div 
                  key={u.id} 
                  onClick={() => handleViewSessions(u)}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-gray-200/50 bg-white/30 hover:bg-gray-200/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-sm font-bold text-red-400 shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">{u.name}</p>
                        {u.role === 'admin' && (
                          <span className="bg-red-100 text-red-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 md:gap-8 mt-3 md:mt-0">
                    <div className="text-left md:text-right">
                      <p className="text-xs font-semibold text-red-600">
                        {u._count?.messages || 0}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Queries Asked</p>
                    </div>
                    <div className="text-left md:text-right hidden sm:block">
                      <p className="text-xs font-medium text-gray-700">{u.phoneNumber || 'N/A'}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Phone</p>
                    </div>
                    <div className="text-left md:text-right hidden sm:block">
                      <p className="text-xs font-medium text-gray-700">{u.department || 'N/A'}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Dept</p>
                    </div>
                    <div className="text-left md:text-right hidden lg:block">
                      <p className="text-xs font-medium text-gray-700">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Registered</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSessions(u);
                        }}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1" />
                        Conversations
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversations History Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative bg-white border-2 border-red-100 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-red-500" />
                  Conversations of {selectedUser.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedUser.email} {selectedUser.phoneNumber && `· ${selectedUser.phoneNumber}`} · {selectedUser._count?.messages || 0} total messages
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                aria-label="Close conversations modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex overflow-hidden">
              {sessionsLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                  <p className="text-sm text-gray-500 mt-2">Loading user conversations...</p>
                </div>
              ) : userSessions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                  <h4 className="text-base font-semibold text-gray-800">No Conversations Found</h4>
                  <p className="text-xs text-gray-400 mt-1">This user hasn't had any chat sessions yet.</p>
                </div>
              ) : (
                <>
                  {/* Left Column: Chat Sessions List */}
                  <div className="w-80 border-r border-gray-100 overflow-y-auto p-3 space-y-2 bg-gray-50/50">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
                      Session History
                    </p>
                    {userSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`w-full flex flex-col items-start p-3 rounded-xl text-left border transition-all ${
                          selectedSessionId === session.id
                            ? 'bg-red-50 border-red-200 text-red-900 shadow-sm'
                            : 'bg-white border-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50/50 shadow-sm'
                        }`}
                      >
                        <p className="text-xs font-semibold truncate w-full">
                          {session.summary || 'New conversation'}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2 w-full justify-between">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {new Date(session.startedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="bg-gray-200/50 text-gray-500 px-1.5 py-0.5 rounded-full text-[9px] font-medium">
                            {session.messages?.length || 0} msgs
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Right Column: Active Session Chat Thread */}
                  <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    {selectedSession ? (
                      <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Selected Session Header */}
                        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {selectedSession.summary || 'Selected conversation'}
                          </p>
                          <span className="text-[10px] text-gray-400">
                            ID: {selectedSession.id.slice(0, 8)}...
                          </span>
                        </div>

                        {/* Message Feed */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/20">
                          {selectedSession.messages?.map((msg: any) => (
                            <div
                              key={msg.id}
                              className={`flex gap-3 ${
                                msg.role === 'user' ? 'flex-row-reverse' : ''
                              }`}
                            >
                              {/* Avatar */}
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm overflow-hidden ${
                                  msg.role === 'user' ? 'bg-red-600' : 'border border-red-100 bg-white'
                                }`}
                              >
                                {msg.role === 'user' ? (
                                  <User className="w-4 h-4 text-white" />
                                ) : (
                                  <img src="/ritza.png" alt="Ritza" className="w-full h-full object-cover" />
                                )}
                              </div>
                              {/* Message bubble */}
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                                  msg.role === 'user'
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200 leading-relaxed shadow-sm'
                                }`}
                              >
                                {msg.content}
                                {msg.optionClicked && (
                                  <div className="mt-1.5 pt-1.5 border-t border-red-500/20 text-[10px] font-semibold text-red-200 flex items-center gap-1">
                                    <span>Option Clicked:</span>
                                    <span className="bg-red-700/50 px-1.5 py-0.5 rounded text-white">{msg.optionClicked}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                        <MessageSquare className="w-10 h-10 mb-2 text-gray-300" />
                        <p className="text-sm">Select a session from the history list to read.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
