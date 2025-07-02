"use client";

import { useState } from 'react';
import FileUpload from '../../components/FileUpload';
import ReportDashboard from '../../components/ReportDashboard';
import { useAuth } from '../../context/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [reportId, setReportId] = useState<number | null>(null);
  const { isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-600 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900">
      {/* Header with logout button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          <span>Logout</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <Image
          src="/images/dashboard-hero-dark.jpg"
          alt="Dashboard background"
          width={1920}
          height={600}
          className="w-full h-64 object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Automated <span className="text-blue-400">Report</span> System
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Transform your data into actionable insights with AI-powered analytics
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-16 relative z-10">
        {reportId ? (
          <ReportDashboard reportId={reportId} />
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-1 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-indigo-600/30"></div>
            <div className="p-8">
              <FileUpload onUploadSuccess={(fileId, reportId) => setReportId(reportId || fileId)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}