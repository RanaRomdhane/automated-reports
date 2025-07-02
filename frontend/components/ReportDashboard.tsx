// ReportDashboard.tsx
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, LineChart, ScatterChart,
  Bar, Line, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import dynamic from 'next/dynamic';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center">Loading visualization...</div>
});

interface ReportData {
  summary_stats: {
    row_count: number;
    columns: string[];
    numeric_stats: Record<string, any>;
    insights?: Array<string | { summary: string; stats?: Record<string, any> }>;
  };
  visualizations?: {
    revenue_trend?: any;
    correlation_matrix?: any;
    [key: string]: any;
  };
  ai_analysis?: {
    anomalies?: any[];
    [key: string]: any;
  };
}

export default function ReportDashboard({ reportId }: { reportId: number }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const { token, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!token) throw new Error('No authentication token found');

        const response = await axios.get(`http://localhost:5000/api/reports/${reportId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data?.status === 'success') {
          setReport(response.data.data.report);
        } else {
          throw new Error(response.data?.message || 'Failed to load report');
        }
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            logout();
            router.push('/login');
            return;
          }
          setError(error.response?.data?.message || 'Failed to load report');
        } else {
          setError(error.message || 'An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    if (reportId) fetchReport();
  }, [reportId, token, logout, router]);

  const renderBoxPlot = (data: any, columnName: string) => {
    if (!data || !columnName) return null;

    const plotData = [{
      y: data.values || [],
      type: "box" as const,
      name: columnName,
      boxpoints: 'outliers' as "outliers",
      jitter: 0.3,
      pointpos: -1.8,
      marker: { color: '#3b82f6' },
      line: { color: '#1d4ed8' }
    }];
    
    return (
      <Plot
        data={plotData}
        layout={{
          title: { 
            text: `${columnName} Distribution`,
            font: { color: '#f3f4f6' }
          },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          yaxis: { 
            title: { text: columnName, font: { color: '#9ca3af' } },
            gridcolor: 'rgba(75, 85, 99, 0.3)',
            tickfont: { color: '#9ca3af' }
          },
          margin: { t: 40, r: 20, b: 40, l: 60 }
        }}
        style={{ width: '100%', height: '300px' }}
        config={{ displayModeBar: false }}
      />
    );
  };

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay message={error} />;
  if (!report) return <NoDataDisplay />;

  const numericStats = report.report_data?.summary_stats?.numeric_stats || {};
  const numericColumns = Object.keys(numericStats);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-4 md:p-8">
      {/* Header with animated gradient border */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-800 mb-8"
      >
        <div className="p-6 md:p-8">
<div className="flex flex-col md:flex-row justify-between items-start md:items-center">
  <div>
    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
      Analytics Dashboard
    </h1>
    <div className="flex items-center space-x-4 mt-2">
      <span className="text-sm text-gray-400">
        <span className="font-medium">Report ID:</span> {report.id}
      </span>
      <span className="hidden md:block text-sm text-gray-400">
        <span className="font-medium">File:</span> {report.filename}
      </span>
      <span className="text-sm text-gray-400">
        <span className="font-medium">Uploaded:</span> {new Date(report.upload_date).toLocaleString()}
      </span>
    </div>
  </div>
  
  <button 
    onClick={() => window.location.href = '/dashboard'}
    className="mt-4 md:mt-0 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-all duration-200 flex items-center"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
    Back to Upload
  </button>
</div>
        </div>
      </motion.div>

      {/* Navigation Tabs with animated indicator */}
      <div className="relative mb-8">
        <div className="flex space-x-1 bg-gray-900/50 rounded-xl p-1 border border-gray-800">
          {['overview', 'visualizations', 'ai-insights', 'raw-data'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                activeTab === tab 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        {activeTab === 'overview' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard 
                title="Total Rows" 
                value={report.report_data?.summary_stats?.row_count?.toLocaleString() || '0'} 
                icon="📊"
                trend="up"
                change="12%"
              />
              <SummaryCard 
                title="Total Columns" 
                value={report.report_data?.summary_stats?.columns?.length || '0'} 
                icon="🗂️"
                trend="neutral"
              />
              <SummaryCard 
                title="Numeric Columns" 
                value={numericColumns.length || '0'} 
                icon="🔢"
                trend="up"
                change="5%"
              />
            </div>

            {/* Insights */}
            {report.report_data?.summary_stats?.insights && (
              <ChartContainer title="Key Insights" icon="💡">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {report.report_data.summary_stats.insights.map((insight: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700 rounded-xl p-4 transition-all duration-200"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 text-blue-400 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-gray-300">
                            {typeof insight === 'string' ? insight : insight.summary}
                          </p>
                          {typeof insight === 'object' && insight.stats && (
                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                              {Object.entries(insight.stats).map(([stat, value]) => (
                                <div key={stat} className="flex justify-between text-gray-400">
                                  <span className="capitalize">{stat}:</span>
                                  <span className="font-medium text-gray-200">
                                    {typeof value === 'number' ? value.toFixed(2) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ChartContainer>
            )}

            {/* Column Analysis */}
            {numericColumns.length > 0 && (
              <ChartContainer title="Column Analysis" icon="📈">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Select a column for detailed analysis:
                  </label>
                  <div className="relative">
                    <select
                      value={selectedColumn || ''}
                      onChange={(e) => setSelectedColumn(e.target.value || null)}
                      className="block w-full bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                      <option value="">-- Select a column --</option>
                      {numericColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {selectedColumn && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                      <h3 className="text-lg font-medium mb-4 text-gray-300">
                        Distribution of {selectedColumn}
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[numericStats[selectedColumn]]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.3)" />
                          <XAxis 
                            dataKey="name" 
                            stroke="#9ca3af"
                          />
                          <YAxis 
                            stroke="#9ca3af"
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(17, 24, 39, 0.9)',
                              borderColor: 'rgba(55, 65, 81, 1)',
                              borderRadius: '0.5rem',
                              color: '#f3f4f6'
                            }}
                          />
                          <Bar 
                            dataKey="mean" 
                            fill="#3b82f6" 
                            name="Mean" 
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="50%" 
                            fill="#10b981" 
                            name="Median" 
                            radius={[4, 4, 0, 0]}
                          />
                          <ReferenceLine 
                            y={numericStats[selectedColumn]['mean']} 
                            stroke="#3b82f6" 
                            strokeDasharray="3 3"
                          />
                          <ReferenceLine 
                            y={numericStats[selectedColumn]['50%']} 
                            stroke="#10b981" 
                            strokeDasharray="3 3"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                      <h3 className="text-lg font-medium mb-4 text-gray-300">
                        Spread of {selectedColumn}
                      </h3>
                      {renderBoxPlot(numericStats[selectedColumn], selectedColumn)}
                    </div>
                  </div>
                )}
              </ChartContainer>
            )}
          </>
        )}

        {activeTab === 'visualizations' && (
          <div className="space-y-8">
            {report.report_data?.visualizations?.revenue_trend && (
              <ChartContainer title="Revenue Trend" icon="📉">
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                  <Plot
                    data={report.report_data.visualizations.revenue_trend.data}
                    layout={{
                      ...report.report_data.visualizations.revenue_trend.layout,
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      font: { color: '#f3f4f6' },
                      xaxis: {
                        gridcolor: 'rgba(75, 85, 99, 0.3)',
                        tickfont: { color: '#9ca3af' }
                      },
                      yaxis: {
                        gridcolor: 'rgba(75, 85, 99, 0.3)',
                        tickfont: { color: '#9ca3af' }
                      }
                    }}
                    config={{ 
                      responsive: true,
                      displayModeBar: false 
                    }}
                    style={{ width: '100%', height: '500px' }}
                  />
                </div>
              </ChartContainer>
            )}

            {report.report_data?.visualizations?.correlation_matrix && (
              <ChartContainer title="Feature Correlation" icon="🔗">
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                  <Plot
                    data={report.report_data.visualizations.correlation_matrix.data}
                    layout={{
                      ...report.report_data.visualizations.correlation_matrix.layout,
                      paper_bgcolor: 'rgba(0,0,0,0)',
                      plot_bgcolor: 'rgba(0,0,0,0)',
                      font: { color: '#f3f4f6' }
                    }}
                    config={{ 
                      responsive: true,
                      displayModeBar: false 
                    }}
                    style={{ width: '100%', height: '600px' }}
                  />
                </div>
              </ChartContainer>
            )}
          </div>
        )}

        {activeTab === 'ai-insights' && (
          <div className="space-y-8">
            {report.report_data?.ai_analysis?.anomalies && (
              <ChartContainer title="Detected Anomalies" icon="⚠️">
                <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-800">
                        <tr>
                          {Object.keys(report.report_data.ai_analysis.anomalies[0]).map((key) => (
                            <th 
                              key={key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-gray-900 divide-y divide-gray-800">
                        {report.report_data.ai_analysis.anomalies.map((row: any, i: number) => (
                          <tr 
                            key={i} 
                            className="hover:bg-gray-800/50 transition-colors duration-150"
                          >
                            {Object.values(row).map((val: any, j: number) => (
                              <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {typeof val === 'number' ? val.toFixed(2) : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ChartContainer>
            )}

            {Object.entries(report.report_data?.ai_analysis || {})
              .filter(([key]) => key.endsWith('_forecast'))
              .map(([key, forecastData]) => {
                const columnName = key.replace('_forecast', '');
                return (
                  <ChartContainer key={key} title={`${columnName} Forecast`} icon="🔮">
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={forecastData as any[]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.3)" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9ca3af"
                            label={{ 
                              value: 'Date', 
                              position: 'insideBottomRight', 
                              offset: -5,
                              fill: '#9ca3af'
                            }}
                          />
                          <YAxis 
                            stroke="#9ca3af"
                            label={{ 
                              value: columnName, 
                              angle: -90, 
                              position: 'insideLeft',
                              fill: '#9ca3af'
                            }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(17, 24, 39, 0.9)',
                              borderColor: 'rgba(55, 65, 81, 1)',
                              borderRadius: '0.5rem',
                              color: '#f3f4f6'
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey={columnName} 
                            name={columnName}
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6, stroke: '#1d4ed8' }}
                          />
                          <Scatter 
                            dataKey={columnName}
                            name="Forecast"
                            fill="#f59e0b"
                            stroke="#f59e0b"
                            fillOpacity={0.6}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartContainer>
                );
              })}
          </div>
        )}

        {activeTab === 'raw-data' && report.report_data?.summary_stats?.numeric_stats && (
          <ChartContainer title="Detailed Statistics" icon="📋">
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statistic</th>
                      {numericColumns.map((col) => (
                        <th 
                          key={col}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900 divide-y divide-gray-800">
                    {Object.entries(numericStats[numericColumns[0]] || {}).map(([stat]) => (
                      <tr key={stat} className="hover:bg-gray-800/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300 capitalize">
                          {stat}
                        </td>
                        {numericColumns.map((col) => (
                          <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {typeof numericStats[col][stat] === 'number' 
                              ? numericStats[col][stat].toFixed(2) 
                              : String(numericStats[col][stat])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ChartContainer>
        )}
      </motion.div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <div className="animate-pulse space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-64 bg-gray-800 rounded"></div>
            <div className="h-4 w-48 bg-gray-800 rounded mt-2"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-10 w-24 bg-gray-800 rounded-lg"></div>
            <div className="h-10 w-24 bg-gray-800 rounded-lg"></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-32 bg-gray-800 rounded-lg"></div>
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-800 rounded-xl"></div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-800 rounded-xl"></div>
          <div className="h-96 bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-lg border border-red-900/50 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-1 bg-gradient-to-r from-red-900/50 to-red-800/30"></div>
        <div className="p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/20 mb-4">
            <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Error Loading Report</h3>
          <p className="text-gray-400 mb-6">{message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 inline-flex items-center"
          >
            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

function NoDataDisplay() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-lg border border-yellow-900/50 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-1 bg-gradient-to-r from-yellow-900/50 to-yellow-800/30"></div>
        <div className="p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-900/20 mb-4">
            <svg className="h-6 w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No Data Available</h3>
          <p className="text-gray-400 mb-6">
            The report data could not be found. Please try uploading a new file.
          </p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors duration-200 inline-flex items-center"
          >
            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Upload New File
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ 
  title, 
  value, 
  icon,
  trend,
  change
}: { 
  title: string
  value: string | number
  icon: string
  trend?: 'up' | 'down' | 'neutral'
  change?: string
}) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-yellow-400'
  };

  const trendIcons = {
    up: '⬆️',
    down: '⬇️',
    neutral: '➡️'
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg border border-gray-800 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-400">{title}</h3>
            <p className="text-3xl font-bold mt-1 text-white">
              {value}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl">{icon}</span>
            {trend && change && (
              <span className={`text-xs mt-1 ${trendColors[trend]}`}>
                {trendIcons[trend]} {change}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartContainer({ 
  title, 
  children,
  icon
}: { 
  title: string
  children: React.ReactNode
  icon?: string
}) {
  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-900/30 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-gray-800">
      <div className="p-1 bg-gradient-to-r from-blue-900/30 to-purple-900/30"></div>
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}