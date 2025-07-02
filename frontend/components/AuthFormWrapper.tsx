"use client";

import Image from 'next/image';
import { ReactNode } from 'react';

export default function AuthFormWrapper({ 
  children,
  title 
}: { 
  children: ReactNode,
  title: string 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image 
            src="/images/logo-light.svg" 
            alt="Logo"
            width={120}
            height={40}
            className="mx-auto"
          />
          <h2 className="mt-6 text-3xl font-bold text-white">{title}</h2>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl shadow-xl overflow-hidden border border-gray-700/30">
          <div className="p-8 space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}