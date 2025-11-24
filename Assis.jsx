import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Mic, Send, Loader2, BookOpen, X, Sparkles, Zap, Brain, CheckCircle, Star, Award, Target, MessageSquare } from 'lucide-react';

export default function StudentHelper() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [showWelcome, setShowWelcome] = useState(true);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setShowWelcome(false);
    setMessages(prev => [...prev, { role: 'user', content: userMessage, type: 'text' }]);
    setIsLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: `You are an expert AI tutor helping students learn. For this question, provide:
1. A clear, step-by-step solution
2. Explanation of key concepts
3. Tips to remember the concept

Question: ${userMessage}`
            }
          ],
        }),
      });

      const data = await response.json();
      const assistantMessage = data.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n');

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage, type: 'text' }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ Connection error. Please check your internet and try again.', 
        type: 'text' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file || isLoading) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target.result.split(',')[1];
      const imageUrl = e.target.result;
      
      setShowWelcome(false);
      setMessages(prev => [...prev, { 
        role: 'user', 
        content: imageUrl, 
        type: 'image' 
      }]);
      setIsLoading(true);

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: file.type,
                      data: base64Data
                    }
                  },
                  {
                    type: 'text',
                    text: `Analyze this image carefully and help solve any problems shown. Provide:
1. What you see in the image
2. Step-by-step solution
3. Clear explanations
4. Key concepts to remember`
                  }
                ]
              }
            ],
          }),
        });

        const data = await response.json();
        const assistantMessage = data.content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('\n');

        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: assistantMessage, 
          type: 'text' 
        }]);
      } catch (error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '⚠️ Error processing image. Please try again with a clearer photo.', 
          type: 'text' 
        }]);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setShowWelcome(false);
          setMessages(prev => [...prev, { 
            role: 'user', 
            content: `🎤 ${transcript}`, 
            type: 'text' 
          }]);
          setTimeout(() => {
            handleSendMessage();
          }, 500);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: '⚠️ Could not understand audio. Please speak clearly and try again.', 
            type: 'text' 
          }]);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        mediaRecorder.start();
        setIsRecording(true);
      } else {
        alert('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions in your browser settings.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
    setShowWelcome(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2.5 rounded-xl shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Study Assistant</h1>
              <p className="text-sm text-gray-600">Powered by Advanced AI</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all border border-gray-300"
            >
              <X className="w-4 h-4" />
              New Chat
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Welcome Screen with Advantages */}
        {showWelcome && messages.length === 0 && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Next Generation Learning Platform
              </div>
              <h2 className="text-5xl font-bold text-gray-900 mb-4">
                Learn Smarter, Not Harder
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                Your personal AI tutor that understands text, images, and voice to provide instant, detailed explanations for any subject.
              </p>
              
              {/* CTA Section */}
              <div className="text-center bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-lg mb-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Start Learning?</h3>
                <p className="text-gray-600 mb-4">Choose your preferred input method below and ask your first question!</p>
                
                {/* Example Questions */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 mb-6 border border-amber-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3">✨ Try asking questions like:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
                    {[
                      "Explain photosynthesis step by step",
                      "How do I solve quadratic equations?",
                      "What caused World War II?",
                      "Explain Newton's laws of motion",
                      "Help me write a thesis statement",
                      "What is the periodic table?"
                    ].map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(question);
                          setActiveTab('text');
                          window.scrollTo({ top: document.querySelector('.bg-white.rounded-2xl.shadow-lg.border').offsetTop - 100, behavior: 'smooth' });
                        }}
                        className="text-sm text-gray-700 bg-white hover:bg-amber-100 px-4 py-2 rounded-lg text-left transition-all border border-gray-200 hover:border-amber-400"
                      >
                        💡 {question}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-center gap-3">
                  <button onClick={() => setActiveTab('text')} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all">
                    <Sparkles className="w-5 h-5" />
                    Get Started Now
                  </button>
                </div>
              </div>
            </div>

            {/* Input Methods Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
              {[
                { icon: MessageSquare, title: 'Text Input', desc: 'Type your questions', color: 'blue' },
                { icon: Upload, title: 'Upload Images', desc: 'Share homework photos', color: 'green' },
                { icon: Camera, title: 'Camera Scan', desc: 'Instant capture', color: 'purple' },
                { icon: Mic, title: 'Voice Input', desc: 'Speak naturally', color: 'pink' }
              ].map((method, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300">
                  <div className={`w-12 h-12 bg-gradient-to-br from-${method.color}-400 to-${method.color}-600 rounded-lg flex items-center justify-center mb-4`}>
                    <method.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{method.title}</h3>
                  <p className="text-sm text-gray-600">{method.desc}</p>
                </div>
              ))}
            </div>

            {/* Advantages Section */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border-2 border-amber-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-xl">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Why Choose Us?</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: Brain,
                    title: 'Advanced AI Technology',
                    desc: 'Powered by Claude Sonnet 4, the most advanced AI model for education, providing human-like understanding and explanations.',
                    highlight: 'Unlike basic chatbots'
                  },
                  {
                    icon: Camera,
                    title: 'Multi-Modal Learning',
                    desc: 'Upload handwritten notes, textbook pages, or diagrams. Our AI reads and understands visual content instantly.',
                    highlight: 'Most tools only accept text'
                  },
                  {
                    icon: Target,
                    title: 'Step-by-Step Solutions',
                    desc: 'Not just answers—get detailed explanations, concept breakdowns, and learning tips to truly understand the material.',
                    highlight: 'Others just give answers'
                  },
                  {
                    icon: Zap,
                    title: 'Instant Response',
                    desc: 'Real-time processing with no wait times. Get help immediately, whether you\'re studying at midnight or during class breaks.',
                    highlight: 'No scheduling required'
                  },
                  {
                    icon: Mic,
                    title: 'Voice Recognition',
                    desc: 'Simply speak your question naturally. Perfect for when typing is inconvenient or you\'re on the go.',
                    highlight: 'Hands-free learning'
                  },
                  {
                    icon: BookOpen,
                    title: 'All Subjects Covered',
                    desc: 'From mathematics to literature, physics to history. One platform for all your academic needs across every subject.',
                    highlight: 'Complete solution'
                  }
                ].map((advantage, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-lg flex-shrink-0">
                        <advantage.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">{advantage.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{advantage.desc}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                          <Star className="w-3 h-3" />
                          {advantage.highlight}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Key Differentiators */}
              <div className="mt-8 bg-white rounded-xl p-6 border-2 border-amber-300">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  What Makes Us Different
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">100% Free Access</p>
                      <p className="text-xs text-gray-600">No subscriptions or hidden fees</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Privacy First</p>
                      <p className="text-xs text-gray-600">Your data stays secure and private</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">24/7 Availability</p>
                      <p className="text-xs text-gray-600">Learn anytime, anywhere</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>
        )}

        {/* Input Interface */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {[
              { id: 'text', icon: MessageSquare, label: 'Text' },
              { id: 'upload', icon: Upload, label: 'Upload' },
              { id: 'camera', icon: Camera, label: 'Camera' },
              { id: 'voice', icon: Mic, label: 'Voice' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-amber-600 border-b-2 border-amber-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'text' && (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-amber-500 transition-all"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            )}

            {activeTab === 'upload' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full py-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all flex flex-col items-center gap-3 disabled:opacity-50"
                >
                  <Upload className="w-12 h-12 text-gray-400" />
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-700">Upload Image</p>
                    <p className="text-sm text-gray-500">Click to select a photo</p>
                  </div>
                </button>
              </div>
            )}

            {activeTab === 'camera' && (
              <div>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
                  className="hidden"
                />
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full py-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all flex flex-col items-center gap-3 disabled:opacity-50"
                >
                  <Camera className="w-12 h-12 text-gray-400" />
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-700">Take Photo</p>
                    <p className="text-sm text-gray-500">Use your camera</p>
                  </div>
                </button>
              </div>
            )}

            {activeTab === 'voice' && (
              <div>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                  className={`w-full py-12 border-2 rounded-xl transition-all flex flex-col items-center gap-3 ${
                    isRecording
                      ? 'border-red-400 bg-red-50'
                      : 'border-dashed border-gray-300 hover:border-amber-500 hover:bg-amber-50'
                  } disabled:opacity-50`}
                >
                  <Mic className={`w-12 h-12 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-700">
                      {isRecording ? 'Recording...' : 'Voice Input'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isRecording ? 'Speak clearly' : 'Click to start'}
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        {!showWelcome && messages.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 max-h-[600px] overflow-y-auto">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                        : 'bg-gray-100 text-gray-900 border border-gray-200'
                    }`}
                  >
                    {msg.type === 'image' ? (
                      <img src={msg.content} alt="User upload" className="rounded-lg max-w-full h-auto" />
                    ) : (
                      <div className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                      <span className="text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Footer with Developer Credit */}
      <footer className="bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200 mt-16 py-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">Developed with ❤️ by</p>
            <h2 className="text-6xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent" style={{fontFamily: 'Georgia, serif', letterSpacing: '2px'}}>
              Kartik
            </h2>
            <p className="text-sm text-gray-500 mt-2">Full Stack Developer & AI Enthusiast</p>
          </div>
          <div className="flex justify-center gap-8 text-sm text-gray-600">
            <span>© 2024 AI Study Assistant</span>
            <span>•</span>
            <span>All Rights Reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
