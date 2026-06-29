import React from 'react';
import Link from 'next/link';
import LayoutWrapper from '@/components/public/layout-wrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function SubmitCancelPage() {
  return (
    <LayoutWrapper>
      <div className="editorial-container py-20 max-w-md mx-auto text-center animate-in fade-in duration-300">
        <Card className="border-slate-200 shadow-xl rounded-3xl bg-white overflow-hidden">
          <div className="bg-slate-900 text-white p-6 relative">
            <div className="absolute -top-[40%] -right-[10%] w-32 h-32 rounded-full bg-orange-500 blur-2xl opacity-40" />
            <div className="relative z-10 space-y-1">
              <h2 className="text-xl font-bold tracking-tight">Payment Cancelled</h2>
              <p className="text-xs text-slate-300">Your draft was not submitted</p>
            </div>
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="mx-auto w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-inner">
              <AlertCircle className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-800 text-base">Transaction Cancelled</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The checkout session was cancelled and no charges were made. Your article was not submitted for review. If this was an error, you can return to the form and try again.
              </p>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex flex-col gap-2.5">
              <Link href="/posts/submit" className="w-full">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 text-xs shadow-sm flex items-center justify-center gap-1">
                  <RefreshCw className="h-3.5 w-3.5" /> Return to Submission Form
                </Button>
              </Link>
              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full border-slate-200 text-xs h-10 flex items-center justify-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5 text-slate-400" /> Back to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  );
}
