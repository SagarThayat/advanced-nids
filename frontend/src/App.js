import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import './App.css';
import './index.css';

const API_URL = "http://127.0.0.1:5000";

function App() {
    const [status, setStatus] = useState({ stats: [], alerts: [] });
    const [backendStatus, setBackendStatus] = useState('Stopped');
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/status`);
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
            await axios.get(`${API_URL}/start`);
            setBackendStatus('Running');
        } catch (e) {
            alert('Run backend as ADMIN: cd backend && python app.py');
        }
    };

    const chartData = status.stats && status.stats.length > 0
        ? status.stats.map(s => ({
            ip: s.ip || 'Unknown',
            pkts: s.pkts_per_min || 0,
            ports: s.syn_ports || 0
        }))
        : [{ ip: 'No Data', pkts: 0, ports: 0 }];

    const recentAlerts = status.alerts ? status.alerts.slice(-10).reverse() : [];

    return (
        <div className="App app-container">
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
                                <XAxis dataKey="ip" stroke="#00d4ff" />
                                <YAxis stroke="#a100ff" />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="pkts" stroke="#ff7300" strokeWidth={3} />
                                <Line type="monotone" dataKey="ports" stroke="#00ff73" strokeWidth={3} />
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
                    ) : (
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="ip" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="ports" stroke="#00ff73" fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="alerts-section">
                <div className="chart-card alerts-card">
                    <h3>🚨 Recent Alerts ({recentAlerts.length})</h3>
                    {recentAlerts.length > 0 ? (
                        <ul className="alerts-list">
                            {recentAlerts.map((alert, i) => (
                                <li key={i} className="alert-item">
                                    {typeof alert === 'object' ? JSON.stringify(alert) : alert}
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

            {!loading && status.stats && status.stats.length > 0 && (
                <div className="stats-section">
                    <div className="chart-card stats-card">
                        <h3>📈 Live Network Stats</h3>
                        <table className="stats-table">
                            <thead>
                                <tr>
                                    <th>IP</th>
                                    <th>Pkts/Min</th>
                                    <th>SYN Ports</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {status.stats.map((stat, i) => (
                                    <tr key={i}>
                                        <td>{stat.ip}</td>
                                        <td>{stat.pkts_per_min || 0}</td>
                                        <td>{stat.syn_ports || 0}</td>
                                        <td>
                                            {stat.pkts_per_min > 100 || stat.syn_ports > 10
                                                ? '⚠️ Suspicious'
                                                : '✅ Normal'}
                                        </td>
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

