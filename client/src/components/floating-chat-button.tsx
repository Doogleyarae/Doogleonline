import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface FloatingChatButtonProps {
  whatsappNumber?: string;
  telegramUsername?: string;
  onMessageUs?: () => void;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
  whatsappNumber = "+1234567890",
  telegramUsername = "doogleonline",
  onMessageUs
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch contact information from admin settings
  const { data: contactInfo } = useQuery({
    queryKey: ["/api/contact-info"],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Use contact info from admin settings if available, otherwise use props
  const actualWhatsappNumber = (contactInfo as any)?.whatsapp || whatsappNumber;
  const actualTelegramUsername = (contactInfo as any)?.telegram?.replace('@', '') || telegramUsername;

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleWhatsApp = () => {
    const message = "Hello! I need help with Doogle Online services.";
    const whatsappUrl = `https://wa.me/${actualWhatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleTelegram = () => {
    const message = "Hello! I need help with Doogle Online services.";
    const telegramUrl = `https://t.me/${actualTelegramUsername}?text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleMessageUs = () => {
    if (onMessageUs) {
      onMessageUs();
    } else {
      // Navigate to contact page
      setLocation('/contact');
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Options Popup */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200">
          {/* Message Us Option */}
          <button
            onClick={handleMessageUs}
            className="flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-lg shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="font-medium">Message Us</span>
          </button>

          {/* WhatsApp Option */}
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </div>
            <span className="font-medium">WhatsApp</span>
          </button>

          {/* Telegram Option */}
          <button
            onClick={handleTelegram}
            className="flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <span className="font-medium">Telegram</span>
          </button>
        </div>
      )}

      {/* Main Floating Button */}
      <button
        onClick={toggleChat}
        className={cn(
          "w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center",
          isOpen && "rotate-45"
        )}
        aria-label="Open chat options"
      >
        <svg 
          className="w-6 h-6 transition-transform duration-200" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            // X icon when open
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            // Chat icon when closed
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          )}
        </svg>
      </button>
    </div>
  );
};

export default FloatingChatButton; 