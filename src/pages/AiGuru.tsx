import React from 'react';
import AiGuru from '@/components/AiGuru';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import "@/config/firebase";

const AiGuruPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen bg-[#343541] flex flex-col overflow-hidden fixed inset-0">
      {/* Page Header - ChatGPT Style */}
      <div className="bg-[#343541] border-b border-[#4e4f5f] px-4 py-3 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              size="sm"
              className="h-8 w-8 p-0 text-[#ececf1] hover:bg-[#4e4f5f]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-[#ececf1]">AI Guru</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container - Takes remaining height, no page scrolling */}
      <div className="flex-1 overflow-hidden relative">
        <AiGuru className="h-full" />
      </div>
    </div>
  );
};

export default AiGuruPage;
