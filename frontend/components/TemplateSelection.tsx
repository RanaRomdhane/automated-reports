"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';

interface Template {
  id: number;
  name: string;
  description: string;
  icon: string;
}

interface TemplateSelectionProps {
  onTemplateSelect: (templateId: number) => void;
  selectedTemplate: number | null;
}

export default function TemplateSelection({ 
  onTemplateSelect, 
  selectedTemplate 
}: TemplateSelectionProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get('http://localhost:5000/api/templates', {
          headers: { 
            'Authorization': `Bearer ${token}` 
          }
        });

        if (response.data?.status === 'success') {
          setTemplates(response.data.data.templates);
        } else {
          throw new Error(response.data?.message || 'Failed to load templates');
        }
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            logout();
            router.push('/login');
            return;
          }
          setError(error.response?.data?.message || 'Failed to load templates');
        } else {
          setError(error.message || 'An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [token, logout, router]);

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border border-gray-800 rounded-lg animate-pulse">
          <div className="h-6 w-3/4 bg-gray-800 rounded mb-2"></div>
          <div className="h-4 w-full bg-gray-800 rounded"></div>
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-900/20 text-red-400 rounded-lg border border-red-800">
      {error}
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">
        Select Report Template
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            whileHover={{ y: -5 }}
            onClick={() => onTemplateSelect(template.id)}
            className={`p-6 rounded-xl cursor-pointer transition-all ${
              selectedTemplate === template.id
                ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 shadow-lg'
                : 'bg-gray-900/50 border border-gray-800 hover:border-blue-500/30 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2 rounded-lg ${
                selectedTemplate === template.id 
                  ? 'bg-blue-600/20 text-blue-400' 
                  : 'bg-gray-800 text-gray-400'
              }`}>
                {template.icon || '📊'}
              </div>
              <h4 className={`text-lg font-medium ${
                selectedTemplate === template.id 
                  ? 'text-white' 
                  : 'text-gray-300'
              }`}>
                {template.name}
              </h4>
            </div>
            <p className={`text-sm ${
              selectedTemplate === template.id 
                ? 'text-gray-300' 
                : 'text-gray-500'
            }`}>
              {template.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}