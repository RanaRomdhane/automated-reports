"use client";

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import TemplateSelection from './TemplateSelection';
import { motion } from 'framer-motion';

interface FileUploadProps {
  onUploadSuccess: (fileId: number, reportId: number) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { isAuthenticated, token, logout } = useAuth();
  const router = useRouter();

  const validateFile = (file: File) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      throw new Error('Invalid file type. Only Excel and CSV files are allowed.');
    }
    
    if (file.size > maxSize) {
      throw new Error('File size exceeds 50MB limit.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        validateFile(e.target.files[0]);
        setFile(e.target.files[0]);
        setStatus('idle');
        setMessage('');
      } catch (error: any) {
        setMessage(error.message);
        setStatus('error');
      }
    }
  };

  const handleUpload = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  
    if (!token) {
      setMessage('Session expired. Please login again.');
      setStatus('error');
      logout();
      router.push('/login');
      return;
    }
  
    if (!file) {
      setMessage('Please select a file first');
      setStatus('error');
      return;
    }
  
    if (!templateId) {
      setMessage('Please select a report template first');
      setStatus('error');
      return;
    }
  
    const formData = new FormData();
    formData.append('file', file);
    formData.append('template_id', templateId.toString());
  
    try {
      setIsUploading(true);
      setStatus('idle');
      setMessage('Uploading and processing file...');
      
      const uploadResponse = await axios.post('http://localhost:5000/api/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 60000
      });
  
      if (uploadResponse.data.status !== 'success') {
        throw new Error(uploadResponse.data.message || 'Upload failed');
      }
  
      if (uploadResponse.data.report_id) {
        setMessage('Report generated successfully!');
        setStatus('success');
        onUploadSuccess(uploadResponse.data.file_id, uploadResponse.data.report_id);
      } else if (uploadResponse.data.file_id) {
        setMessage('File uploaded successfully!');
        setStatus('success');
        onUploadSuccess(uploadResponse.data.file_id, 0);
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (error: any) {
      let errorMessage = 'Error uploading file. Please try again.';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          logout();
          router.push('/login');
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = 'Server is not responding. Please try again later.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      setMessage(errorMessage);
      setStatus('error');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 w-full max-w-3xl mx-auto">
      <div className="flex flex-col space-y-8">
        <TemplateSelection 
          onTemplateSelect={setTemplateId}
          selectedTemplate={templateId}
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-800 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white">Upload Your Data File</h2>
                <p className="text-sm text-gray-400 text-center">
                  Supported formats: .xlsx, .xls, .csv (Max 50MB)
                </p>
                
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-gray-900/50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {file ? (
                      <p className="text-sm text-blue-400 font-medium">
                        {file.name}
                      </p>
                    ) : (
                      <>
                        <p className="mb-2 text-sm text-gray-400">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          Max file size: 50MB
                        </p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept=".xlsx,.xls,.csv" 
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={handleUpload}
            disabled={isUploading || !file || !templateId}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-500 hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Generate Report
              </>
            )}
          </button>
        </motion.div>
        
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`w-full p-4 rounded-lg ${
              status === 'success' 
                ? 'bg-green-900/20 text-green-400 border border-green-800'
                : status === 'error'
                  ? 'bg-red-900/20 text-red-400 border border-red-800'
                  : 'bg-blue-900/20 text-blue-400 border border-blue-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {status === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : status === 'error' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              )}
              <p className="text-sm">{message}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}