'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AVAILABLE_MODELS = [
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-4o-mini',
  'gpt-3.5-turbo'
] as const;

const DEFAULT_DEVELOPER_MESSAGES = [
  'You are a helpful AI assistant.',
  'You are a wise Python programmer.',
  'You are a creative writing expert.',
  'You are a data science expert.',
  'You are a web development expert.',
  'You are a system design expert.',
  'You are a cybersecurity expert.',
  'You are a machine learning expert.',
  'You are a software architecture expert.',
  'You are a database optimization expert.',
] as const;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState<typeof AVAILABLE_MODELS[number]>('gpt-4.1-mini');
  const [developerMessages, setDeveloperMessages] = useState<string[]>([...DEFAULT_DEVELOPER_MESSAGES]);
  const [selectedDeveloperMessage, setSelectedDeveloperMessage] = useState<string>(DEFAULT_DEVELOPER_MESSAGES[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPromptInput, setShowCustomPromptInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAddCustomPrompt = () => {
    if (customPrompt.trim() && !developerMessages.includes(customPrompt.trim())) {
      setDeveloperMessages(prev => [...prev, customPrompt.trim()]);
      setSelectedDeveloperMessage(customPrompt.trim());
      setCustomPrompt('');
      setShowCustomPromptInput(false);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile || !apiKey) return;
    setUploading(true);
    setUploadError(null);
    setDocumentId(null);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('api_key', apiKey);
      const response = await fetch('/api/upload_pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.status === 'ok') {
        setDocumentId(data.document_id);
      } else {
        setUploadError(data.detail || 'Upload failed');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: selectedDeveloperMessage,
          user_message: userMessage,
          model: selectedModel,
          api_key: apiKey,
          document_id: documentId,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let assistantMessage = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = new TextDecoder().decode(value);
        assistantMessage += text;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = assistantMessage;
            return [...newMessages];
          } else {
            return [...newMessages, { role: 'assistant', content: assistantMessage }];
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100%-4rem)] max-w-4xl mx-auto">
      <div className="mb-4 flex gap-4 items-center">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your OpenAI API key"
          className="flex-1 p-2 border border-blue-200 rounded bg-white focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all"
        />
      </div>
      <div className="mb-4 space-y-4">
        <div className="flex gap-4 items-center">
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfChange}
            className="p-2 border border-blue-200 rounded bg-white"
            disabled={uploading || !apiKey}
          />
          <button
            onClick={handlePdfUpload}
            disabled={!pdfFile || uploading || !apiKey}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            type="button"
          >
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </button>
          {documentId && (
            <span className="ml-2 text-green-600">PDF indexed!</span>
          )}
          {uploadError && (
            <span className="ml-2 text-red-600">{uploadError}</span>
          )}
        </div>
        <div className="flex gap-4">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as typeof AVAILABLE_MODELS[number])}
            className="w-48 p-2 border border-blue-200 rounded bg-white focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all"
          >
            {AVAILABLE_MODELS.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <label htmlFor="developer-message" className="block text-sm font-medium text-blue-700 mb-1">
              AI Assistant Role
            </label>
            <select
              id="developer-message"
              value={selectedDeveloperMessage}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setShowCustomPromptInput(true);
                } else {
                  setSelectedDeveloperMessage(e.target.value);
                }
              }}
              className="w-full p-2 border border-blue-200 rounded bg-white focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all"
            >
              {developerMessages.map((message) => (
                <option key={message} value={message}>
                  {message}
                </option>
              ))}
              <option value="custom">+ Add Custom Prompt</option>
            </select>
            
            {showCustomPromptInput && (
              <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white border border-blue-200 rounded shadow-lg z-10">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter your custom prompt..."
                  className="w-full p-2 border border-blue-200 rounded mb-2 h-24 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowCustomPromptInput(false);
                      setCustomPrompt('');
                    }}
                    className="px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCustomPrompt}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className={`flex-1 mb-4 space-y-4 ${messages.length > 0 ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-500 text-white ml-auto'
                : 'bg-blue-50 text-blue-900 border border-blue-100'
            } max-w-[80%] markdown-content`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkBreaks]}
              components={{
                p: ({ children }) => <p>{children}</p>,
                ol: ({ children }) => <ol className="list-decimal pl-4 m-0 mb-0 last:mb-0">{children}</ol>,
                ul: ({ children }) => <ul className="list-disc pl-4 m-0 mb-0 last:mb-4">{children}</ul>,
                li: ({ children }) => <li className="m-0 mb-0 p-0">{children}</li>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border border-blue-200 rounded bg-white focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all"
          disabled={isLoading || !apiKey}
        />
        <button
          type="submit"
          disabled={isLoading || !apiKey}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
} 