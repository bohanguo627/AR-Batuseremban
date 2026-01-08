import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Tutorial from './pages/Tutorial';
import Game from './pages/Game';
import Chat from './pages/Chat';
import { LanguageProvider } from './context/LanguageContext';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isGameOver, setIsGameOver] = useState(false);

  const handleGameStart = () => {
    setIsGameOver(false);
    setActiveTab('game');
  }
  
  const handleGameOver = () => {
    setIsGameOver(true);
    setTimeout(() => setActiveTab('home'), 5000); 
  }

  const handleGameExit = () => {
    setIsGameOver(false);
    setActiveTab('home');
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home onStart={handleGameStart} />;
      case 'tutorial':
        return <Tutorial />;
      case 'chat':
        return <Chat />;
      case 'game':
        return <Game 
          key={Date.now()} 
          onGameOver={handleGameOver} 
          onExit={handleGameExit} 
        />;
      default:
        return <Home onStart={handleGameStart} />;
    }
  };
  
  const isGameActive = activeTab === 'game';
  const isChatActive = activeTab === 'chat';

  return (
    <LanguageProvider>
      <div className="bg-heritage-black h-[100dvh] w-full overflow-y-auto overflow-x-hidden text-white font-sans selection:bg-heritage-orange selection:text-white flex flex-col">
        
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} isGameActive={isGameActive} />
        
        {/* DUPLICATE BUTTON REMOVED FROM HERE */}

        <main className="flex-grow relative w-full">
          {renderContent()}
        </main>

        {!isGameActive && !isChatActive && <Footer />}
      </div>
    </LanguageProvider>
  );
};

export default App;