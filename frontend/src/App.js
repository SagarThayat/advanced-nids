import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import './App.css';
import './index.css';

function App() {
    const [status, setStatus] = useState({ stats: [], alerts: [] });
    const [backendStatus, setBackendStatus] = useState('Stopped');
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await axios.get('/api/status');
            setStatus(res.data);
            setLoading(false);
        } catch (e) {
            console.log('Backend connection:', e.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);

    const startBackend = async () => {
        try {
            await axios.get('/start');
            setBackendStatus('Running');
        } catch (e) {
            alert('Start backend: cd backend && python app.py (Run as Administrator!)');
        }
    };

    const chartData = status.stats.length > 0
        ? status.stats.map(s => ({
            ip: s.ip || 'Unknown',
            pkts: s.pkts_per_min || 0,
            ports: s.syn_ports || 0
        }))
        : [{ ip: 'No Data', pkts: 0, ports: 0 }];

    const recentAlerts = status.alerts.slice(-10).reverse();

    return (
        <div className="App app-container">
            {/* Header */}
            <div className="header">
                <h1>🚨 Advanced NIPS Dashboard</h1>
                <p className="status-bar">
                    <span className={`status-badge ${backendStatus === 'Running' ? 'status-running' : ''}`}>
                        Backend: {backendStatus}
                    </span>
                    <button onClick={startBackend}>
                        {backendStatus === 'Running' ? '🔄 Restart Capture' : '▶️ Start Capture'}
                    </button>
                </p>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid charts-container">
                <div className="chart-card">
                    <h3>📊 Packets per Minute</h3>
                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            <span>Connecting to backend...</span>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="ip" stroke="var(--neon-blue)" />
                                <YAxis stroke="var(--neon-purple)" />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(20,20,40,0.9)',
                                        border: '1px solid var(--glass-border)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="pkts"
                                    stroke="var(--neon-blue)"
                                    strokeWidth={3}
                                    dot={{ fill: 'var(--neon-blue)', strokeWidth: 2 }}
                                    activeDot={{ r: 8 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="ports"
                                    stroke="var(--neon-green)"
                                    strokeWidth={3}
                                    dot={{ fill: 'var(--neon-green)', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="chart-card">
                    <h3>🌐 SYN Ports Activity</h3>
                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                        </div>
                    ) : chartData.some(d => d.ports > 0) ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="ip" stroke="var(--neon-green)" />
                                <YAxis stroke="var(--neon-purple)" />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="ports"
                                    stroke="var(--neon-green)"
                                    fill="url(#portsGradient)"
                                />
                                <defs>
                                    <linearGradient id="portsGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--neon-green)" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="rgba(0,255,136,0.2)" />
                                    </linearGradient>
                                </defs>
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state">
                            <span>📡 No port scan activity</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Alerts */}
            <div className="alerts-section alerts-container">
                <div className="chart-card alerts-card">
                    <h3>🚨 Recent Alerts ({recentAlerts.length})</h3>
                    {recentAlerts.length > 0 ? (
                        <ul className="alerts-list">
                            {recentAlerts.map((alert, i) => (
                                <li key={i} className="alert-item">
                                    {alert}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="empty-state">
                            <span>✅ Network quiet - No threats detected</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Live Stats */}
            {!loading && status.stats.length > 0 && (
                <div className="stats-section stats-container">
                    <div className="chart-card stats-card">
                        <h3>📈 Live Network Stats</h3>
                        <table className="stats-table">
                            <thead>
                                <tr>
                                    <th>IP Address</th>
                                    <th>Pkts/Min</th>
                                    <th>SYN Ports</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {status.stats.map((stat, i) => (
                                    <tr key={i}>
                                        <td>{stat.ip}</td>
                                        <td style={{ color: stat.pkts_per_min > 50 ? 'var(--neon-orange)' : 'var(--neon-green)' }}>
                                            {stat.pkts_per_min || 0}
                                        </td>
                                        <td style={{ color: stat.syn_ports > 5 ? 'var(--neon-red)' : 'var(--text-secondary)' }}>
                                            {stat.syn_ports || 0}
                                        </td>
                                        <td>{stat.pkts_per_min > 100 || stat.syn_ports > 10 ? '⚠️ Suspicious' : '✅ Normal'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;

