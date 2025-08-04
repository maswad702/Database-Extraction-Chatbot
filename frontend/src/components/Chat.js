import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, Send, Loader, Info } from 'lucide-react';
import './Chat.css'

const ChatItem = ({ content, role, timestamp, attachment }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isCodeBlock = (str) => {
    const codeIndicators = ['=', ';', '[', ']', '{', '}', '#', '//', 'function', 'const', 'let', 'var'];
    return codeIndicators.some(indicator => str.includes(indicator));
  };

  const MessageContent = ({ content }) => {
    const messageBlocks = content.split('```');
    
    return messageBlocks.map((block, index) => {
      if (index % 2 === 1 || isCodeBlock(block)) {
        return (
          <pre key={index} className="code-block">
            <code>{block.trim()}</code>
          </pre>
        );
      }
      return <p key={index} className="message-text">{block}</p>;
    });
  };

  return (
    <div className={`chat-item ${role}`}>
      <div className={`avatar ${role}`}>
        {role === 'assistant' ? 'AI' : 'U'}
      </div>
      
      <div className="message-content">
        <div className="message-header">
          <span className="timestamp">{timestamp && formatTime(timestamp)}</span>
          {attachment && <span className="attachment">📎 {attachment}</span>}
        </div>
        <MessageContent content={content} />
      </div>
    </div>
  );
};

///UPDATED-1
const Chat = () => {
    const [chatMessages, setChatMessages] = useState([
      {
        role: 'assistant',
        content: 'Welcome! 👋 I\'m here to help you analyze PDF documents. Please start by uploading a PDF file using the upload button below. The file should be less than 10MB in size.',
        timestamp: new Date().toISOString()
      }
    ]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPdfUploaded, setIsPdfUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [isQuestionnaire, setIsQuestionnaire] = useState(false);

  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
//UPDATE-2
  const handleError = useCallback((error) => {
    setError(error.message || 'An error occurred');
    setTimeout(() => setError(null), 5000);
    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: `⚠️ ${error.message || 'An error occurred'}. Please try again.`,
      timestamp: new Date().toISOString()
    }]);
  },[]);

  const validateFile = useCallback((file) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    
    if (!file.type.includes('pdf')) {
      throw new Error('Only PDF files are allowed');
    }
    
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size must be less than 10MB');
    }
    
    return true;
  }, []);

  const processQuestion = useCallback(async (answer = null) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/show_question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer,
          all_answers: answers
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.status === 'complete') {
        setIsQuestionnaire(false);
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `Processing complete!\n\nExecutive Summary:\n${data.executive_summary}`,
          timestamp: new Date().toISOString()
        }]);
        return;
      }

      if (data.status === 'conflicts_detected' || data.status === 'conflicts_continue') {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I found some conflicts in the information. I need to ask you a few more questions.',
          timestamp: new Date().toISOString()
        }]);
      }

      if (data.question) {
        setCurrentQuestion(data.question);
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: data.question,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      handleError(error);
    }
  }, [answers, handleError]);


//UPDATE-3
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      validateFile(file);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:5000/api/process_document', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setIsPdfUploaded(true);
      setSelectedFile(file);
      
      setChatMessages(prev => [...prev, {
        role: 'user',
        content: 'Uploaded file for processing',
        attachment: file.name,
        timestamp: new Date().toISOString()
      }]);

      if (data.questions?.length) {
        setIsQuestionnaire(true);
        setCurrentQuestion(data.questions[0]);
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: data.questions[0],
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [validateFile, handleError]);


 //UPDATE-4 
  const handleSubmit = useCallback(async () => {
    const content = inputRef.current?.value?.trim();
    if (!content) return;

    try {
      setIsSending(true);
      inputRef.current.value = '';

      // Check if PDF has been uploaded
      if (!isPdfUploaded) {
        setChatMessages(prev => [...prev, 
          {
            role: 'user',
            content,
            timestamp: new Date().toISOString()
          },
          {
            role: 'assistant',
            content: 'Please upload a PDF document first before sending messages. Use the upload button on the left to get started.',
            timestamp: new Date().toISOString()
          }
        ]);
        return;
      }

      setChatMessages(prev => [...prev, {
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      }]);

      if (isQuestionnaire) {
        setAnswers(prev => [...prev, content]);
        await processQuestion(content);
      } else {
        const response = await fetch('http://127.0.0.1:5000/api/process_additional_text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: content })
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.status === 'conflicts_detected') {
          setIsQuestionnaire(true);
          setCurrentQuestion(data.questions[0]);
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: data.questions[0],
            timestamp: new Date().toISOString()
          }]);
        } else {
          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: data.executive_summary || 'Processing complete!',
            timestamp: new Date().toISOString()
          }]);
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsSending(false);
    }
  }, [isQuestionnaire, processQuestion, handleError, isPdfUploaded]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

//UPDATE-5
  const handleDeleteChats = useCallback(() => {
    setChatMessages([{
      role: 'assistant',
      content: 'Welcome! 👋 I\'m here to help you analyze PDF documents. Please start by uploading a PDF file using the upload button below. The file should be less than 10MB in size.',
      timestamp: new Date().toISOString()
    }]);
    setSelectedFile(null);
    setCurrentQuestion(null);
    setAnswers([]);
    setIsQuestionnaire(false);
    setIsPdfUploaded(false);
  }, []);

//UPDATE-6
const AboutModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>How to Use This Chatbot</h2>
        <div className="workflow-steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Upload PDF</h3>
            <p>Start by uploading a PDF document using the upload button (📎). The file should be less than 10MB.</p>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <h3>Document Analysis</h3>
            <p>The chatbot will analyze your document and may ask clarifying questions if needed.</p>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <h3>Answer Questions</h3>
            <p>If the chatbot asks questions, provide clear answers to help improve the analysis.</p>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <h3>Get Results</h3>
            <p>Receive detailed analysis and insights about your document. You can ask follow-up questions for clarification.</p>
          </div>
        </div>
        <button className="modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};


  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="sidebar-content">
          <div className="sidebar-avatar">AI</div>
          <p className="sidebar-text">
            Chat with our AI assistant. Upload PDFs for analysis.
          </p>
          <button 
            onClick={() => setIsAboutModalOpen(true)} 
            className="about-button"
            style={{ backgroundColor: '#f96a31', color: '#f9f2f0' }}
          >
            <Info size={20} />
            About This Chatbot
          </button>
        </div>
      </div>
      <div className="main-chat">
        {error}
        
        <div ref={chatBoxRef} className="messages-container">
          {chatMessages.map((chat, index) => (
            <ChatItem key={`${chat.timestamp}-${index}`} {...chat} />
          ))}
        </div>

        <div className="input-container">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf"
            className="file-input"
            onChange={handleFileUpload}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isSending}
            className="icon-button"
          >
            {isLoading ? <Loader className="spinner" /> : <Upload size={20} />}
          </button>
            
          <input
            ref={inputRef}
            type="text"
            className="text-input"
            placeholder={isQuestionnaire ? "Type your answer..." : "Send a message..."}
            onKeyPress={handleKeyPress}
            disabled={isLoading || isSending}
          />
            
          <button 
            onClick={handleSubmit}
            disabled={isLoading || isSending}
            className="icon-button"
          >
            {isSending ? <Loader className="spinner" /> : <Send size={20} />}
          </button>
        </div>
          
        {selectedFile && (
          <p className="selected-file">
            Selected file: {selectedFile.name}
          </p>
        )}
      </div>
      <AboutModal 
        isOpen={isAboutModalOpen} 
        onClose={() => setIsAboutModalOpen(false)} 
      />
    </div>
  );
};
export default Chat;