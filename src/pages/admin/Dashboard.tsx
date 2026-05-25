import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, FileText, Search, Loader2, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../lib/api';

interface Metrics {
  totalUsers: number;
  totalDocs: number;
  totalQueries: number;
  totalChunks: number;
  activeSessions: number;
}

interface UsageDay {
  name: string;
  queries: number;
  users: number;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [weeklyUsage, setWeeklyUsage] = useState<UsageDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/admin/analytics');
        setMetrics(res.data.metrics);
        setWeeklyUsage(res.data.weeklyUsage);
      } catch (err) {
        console.error("Failed to load analytics:", err);
        setError('Failed to load analytics statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            Admin Dashboard <Sparkles className="w-6 h-6 text-red-400" />
          </h1>
          <p className="text-gray-600 mt-2">Real-time overview of guided AI assistant usage and indexed data.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gray-50/50 border-gray-200 backdrop-blur-xl shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="w-4 h-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{metrics?.totalUsers}</div>
            <p className="text-xs text-red-400 mt-1">Registered users</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-50/50 border-gray-200 backdrop-blur-xl shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Connections</CardTitle>
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{metrics?.activeSessions}</div>
            <p className="text-xs text-gray-500 mt-1">Simulated users online</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-50/50 border-gray-200 backdrop-blur-xl shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Search Queries</CardTitle>
            <Search className="w-4 h-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{metrics?.totalQueries}</div>
            <p className="text-xs text-gray-500 mt-1">Logged across sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-50/50 border-gray-200 backdrop-blur-xl shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Knowledge Base Chunks</CardTitle>
            <FileText className="w-4 h-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{metrics?.totalChunks}</div>
            <p className="text-xs text-gray-500 mt-1">Across {metrics?.totalDocs} documents</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-50/50 border-gray-200 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">System Usage Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyUsage}>
              <defs>
                <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }} 
                labelStyle={{ color: '#e4e4e7' }}
              />
              <Area type="monotone" dataKey="queries" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorQueries)" name="Queries" />
              <Area type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" name="Active Users" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
