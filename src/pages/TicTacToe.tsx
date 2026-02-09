import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, RotateCcw, ArrowLeft, User, Monitor, Volume2, VolumeX, TrendingUp, BarChart3, Zap, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import "@/config/firebase";

type Player = 'X' | 'O' | null;
type Board = Player[];
type GameMode = 'pvp' | 'pvc';
type Difficulty = 'easy' | 'medium' | 'hard';
type GameStats = {
  totalGames: number;
  playerWins: number;
  cpuWins: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
};

const TicTacToe = () => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [xScore, setXScore] = useState(0);
  const [oScore, setOScore] = useState(0);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('pvc');
  const [playerSymbol, setPlayerSymbol] = useState<'X' | 'O'>('X');
  const [userName, setUserName] = useState<string>('Player');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameStats, setGameStats] = useState<GameStats>({
    totalGames: 0,
    playerWins: 0,
    cpuWins: 0,
    draws: 0,
    currentStreak: 0,
    bestStreak: 0
  });
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [autoRestartTimer, setAutoRestartTimer] = useState<NodeJS.Timeout | null>(null);

  // Sound effects
  const playSound = (type: 'move' | 'win' | 'draw' | 'gameOver') => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const currentTime = audioContext.currentTime;
    
    switch (type) {
      case 'move':
        // Nice click/pop sound for moves - short, pleasant tone
        oscillator.frequency.setValueAtTime(800, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.1);
        break;
        
      case 'win':
        // Victory fanfare sound - ascending notes
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, High C
        notes.forEach((freq, index) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.setValueAtTime(freq, currentTime + index * 0.15);
          gain.gain.setValueAtTime(0.3, currentTime + index * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, currentTime + index * 0.15 + 0.4);
          osc.start(currentTime + index * 0.15);
          osc.stop(currentTime + index * 0.15 + 0.4);
        });
        break;
        
      case 'draw':
        // Soft draw/neutral sound - gentle descending tone
        oscillator.frequency.setValueAtTime(440, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.2, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.3);
        break;
        
      case 'gameOver':
        // Game over sound - descending minor chord
        const chordNotes = [440, 349.23, 261.63]; // A, F, C
        chordNotes.forEach((freq, index) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.setValueAtTime(freq, currentTime);
          gain.gain.setValueAtTime(0.2, currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5);
          osc.start(currentTime);
          osc.stop(currentTime + 0.5);
        });
        break;
    }
  };

  // Helper function to get user display name from localStorage (same logic as Profile page)
  const getDisplayName = () => {
    try {
      const storedUserData = localStorage.getItem("user_data");
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        const firstName = userData?.firstName || userData?.fname || userData?.first_name || "";
        const lastName = userData?.lastName || userData?.lname || userData?.last_name || "";
        const fullName = userData?.name || userData?.fullName || userData?.full_name || "";
        
        if (firstName && lastName) return `${firstName} ${lastName}`;
        if (fullName) return fullName;
        if (firstName) return firstName;
      }
    } catch (error) {
      // Error getting user name from localStorage
    }
    return "Player";
  };

  // Load scores from localStorage on mount
  useEffect(() => {
    const savedScores = localStorage.getItem('tictactoe-scores');
    if (savedScores) {
      try {
        const { xScore: savedX, oScore: savedO } = JSON.parse(savedScores);
        setXScore(savedX || 0);
        setOScore(savedO || 0);
      } catch (error) {
        // Error loading scores from localStorage
      }
    }

    const savedGameMode = localStorage.getItem('tictactoe-gamemode');
    if (savedGameMode === 'pvp' || savedGameMode === 'pvc') {
      setGameMode(savedGameMode);
    }

    const savedDifficulty = localStorage.getItem('tictactoe-difficulty');
    if (savedDifficulty === 'easy' || savedDifficulty === 'medium' || savedDifficulty === 'hard') {
      setDifficulty(savedDifficulty);
    }

    const savedSoundEnabled = localStorage.getItem('tictactoe-sound');
    if (savedSoundEnabled !== null) {
      setSoundEnabled(savedSoundEnabled === 'true');
    }

    const savedStats = localStorage.getItem('tictactoe-stats');
    if (savedStats) {
      try {
        const stats = JSON.parse(savedStats);
        setGameStats(stats);
      } catch (error) {
        // Error loading stats from localStorage
      }
    }

    // Get user name from localStorage
    const name = getDisplayName();
    setUserName(name);
  }, []);

  // Save scores to localStorage whenever they change
  useEffect(() => {
    const scoresData = {
      xScore,
      oScore,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('tictactoe-scores', JSON.stringify(scoresData));
  }, [xScore, oScore]);

  // Save game mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tictactoe-gamemode', gameMode);
  }, [gameMode]);

  // Save difficulty to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tictactoe-difficulty', difficulty);
  }, [difficulty]);

  // Save sound preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tictactoe-sound', soundEnabled.toString());
  }, [soundEnabled]);

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];

  const checkWinner = (currentBoard: Board): { winner: Player; line: number[] } => {
    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: combination };
      }
    }
    return { winner: null, line: [] };
  };

  const getEmptyCells = (currentBoard: Board): number[] => {
    return currentBoard.map((cell, index) => cell === null ? index : -1).filter(index => index !== -1);
  };

  const minimax = (currentBoard: Board, depth: number, isMaximizing: boolean): { score: number; move: number } => {
    const { winner } = checkWinner(currentBoard);
    
    if (winner === 'O') return { score: 10 - depth, move: -1 };
    if (winner === 'X') return { score: depth - 10, move: -1 };
    if (getEmptyCells(currentBoard).length === 0) return { score: 0, move: -1 };
    
    const emptyCells = getEmptyCells(currentBoard);
    let bestMove = -1;
    
    if (isMaximizing) {
      let bestScore = -Infinity;
      for (const cell of emptyCells) {
        const newBoard = [...currentBoard];
        newBoard[cell] = 'O';
        const { score } = minimax(newBoard, depth + 1, false);
        if (score > bestScore) {
          bestScore = score;
          bestMove = cell;
        }
      }
      return { score: bestScore, move: bestMove };
    } else {
      let bestScore = Infinity;
      for (const cell of emptyCells) {
        const newBoard = [...currentBoard];
        newBoard[cell] = 'X';
        const { score } = minimax(newBoard, depth + 1, true);
        if (score < bestScore) {
          bestScore = score;
          bestMove = cell;
        }
      }
      return { score: bestScore, move: bestMove };
    }
  };

  const getCpuMove = (currentBoard: Board): number => {
    if (difficulty === 'easy') {
      // Easy: Random moves
      const emptyCells = getEmptyCells(currentBoard);
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else if (difficulty === 'medium') {
      // Medium: 50% random, 50% minimax
      if (Math.random() < 0.5) {
        const emptyCells = getEmptyCells(currentBoard);
        return emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
    }
    // Hard: Always use minimax
    const { move } = minimax(currentBoard, 0, true);
    return move;
  };

  const makeCpuMove = () => {
    if (winner || isDraw) return;
    
    const cpuMove = getCpuMove(board);
    if (cpuMove !== -1) {
      const newBoard = [...board];
      newBoard[cpuMove] = 'O';
      setBoard(newBoard);
      
      const { winner: gameWinner, line } = checkWinner(newBoard);
      if (gameWinner) {
        setWinner(gameWinner);
        setWinningLine(line);
        if (gameWinner === 'X') {
          setXScore(xScore + 1);
        } else {
          setOScore(oScore + 1);
        }
      } else if (newBoard.every(cell => cell !== null)) {
        setIsDraw(true);
      } else {
        setCurrentPlayer('X');
      }
    }
  };

  const handleCellClick = (index: number) => {
    if (board[index] || winner || isDraw) return;
    
    // In PVC mode, only allow player to click when it's their turn
    if (gameMode === 'pvc' && currentPlayer !== playerSymbol) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    playSound('move');

    const { winner: gameWinner, line } = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      setWinningLine(line);
      playSound('win');
      updateGameStats(gameWinner);
      if (gameWinner === 'X') {
        setXScore(xScore + 1);
      } else {
        setOScore(oScore + 1);
      }
    } else if (newBoard.every(cell => cell !== null)) {
      setIsDraw(true);
      playSound('draw');
      updateGameStats('draw');
    } else {
      const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
      setCurrentPlayer(nextPlayer);
    }
  };

  const updateGameStats = (result: 'X' | 'O' | 'draw') => {
    const newStats = { ...gameStats };
    newStats.totalGames++;
    
    if (result === 'draw') {
      newStats.draws++;
      newStats.currentStreak = 0;
    } else if (gameMode === 'pvc') {
      if (result === playerSymbol) {
        newStats.playerWins++;
        newStats.currentStreak++;
        if (newStats.currentStreak > newStats.bestStreak) {
          newStats.bestStreak = newStats.currentStreak;
        }
      } else {
        newStats.cpuWins++;
        newStats.currentStreak = 0;
      }
    }
    
    setGameStats(newStats);
    localStorage.setItem('tictactoe-stats', JSON.stringify(newStats));
  };

  const resetGame = () => {
    // Clear any existing auto-restart timer
    if (autoRestartTimer) {
      clearTimeout(autoRestartTimer);
      setAutoRestartTimer(null);
    }
    
    setBoard(Array(9).fill(null));
    setCurrentPlayer(gameMode === 'pvc' && playerSymbol === 'O' ? 'X' : 'X');
    setWinner(null);
    setIsDraw(false);
    setWinningLine([]);
  };

  const resetScores = () => {
    setXScore(0);
    setOScore(0);
    // Clear scores from localStorage
    localStorage.removeItem('tictactoe-scores');
    resetGame();
  };

  const resetStats = () => {
    const defaultStats = {
      totalGames: 0,
      playerWins: 0,
      cpuWins: 0,
      draws: 0,
      currentStreak: 0,
      bestStreak: 0
    };
    setGameStats(defaultStats);
    localStorage.removeItem('tictactoe-stats');
  };

  const toggleGameMode = () => {
    const newMode = gameMode === 'pvp' ? 'pvc' : 'pvp';
    setGameMode(newMode);
    resetScores();
  };

  // Auto-restart functionality
  useEffect(() => {
    if (winner || isDraw) {
      // Clear any existing timer
      if (autoRestartTimer) {
        clearTimeout(autoRestartTimer);
      }
      
      // Set new timer for auto-restart after 1.5 seconds (faster)
      const timer = setTimeout(() => {
        resetGame();
        playSound('move'); // Play a sound to indicate new game started
      }, 1500);
      
      setAutoRestartTimer(timer);
    }
    
    // Cleanup timer when component unmounts or game resets
    return () => {
      if (autoRestartTimer) {
        clearTimeout(autoRestartTimer);
      }
    };
  }, [winner, isDraw]);

  // CPU move effect
  useEffect(() => {
    if (gameMode === 'pvc' && currentPlayer === 'O' && !winner && !isDraw) {
      const timer = setTimeout(() => {
        makeCpuMove();
      }, 500); // Small delay for better UX
      return () => clearTimeout(timer);
    }
  }, [gameMode, currentPlayer, winner, isDraw, board]);

  const getGameStatus = () => {
    if (winner) {
      const winnerName = gameMode === 'pvc' && winner === 'O' ? 'CPU' : 
                       gameMode === 'pvc' && winner === 'X' ? userName : 
                       gameMode === 'pvp' ? `Player ${winner}` : `Player ${winner}`;
      return `${winnerName} Wins! Auto-restarting...`;
    }
    if (isDraw) {
      return "It's a Draw! Auto-restarting...";
    }
    const currentPlayerName = gameMode === 'pvc' && currentPlayer === 'O' ? 'CPU' : 
                            gameMode === 'pvc' && currentPlayer === 'X' ? userName : 
                            gameMode === 'pvp' ? `Player ${currentPlayer}` : `Player ${currentPlayer}`;
    return `${currentPlayerName}'s Turn`;
  };

  const getCellStyle = (index: number) => {
    const baseStyle = "w-20 h-20 sm:w-20 sm:h-20 text-3xl sm:text-3xl font-bold border-2 border-border rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer hover:bg-muted/50 active:scale-95";
    const isWinningCell = winningLine.includes(index);
    const cellValue = board[index];
    
    let colorStyle = "";
    if (cellValue === 'X') {
      colorStyle = "text-blue-500";
    } else if (cellValue === 'O') {
      colorStyle = "text-red-500";
    }
    
    if (isWinningCell) {
      return `${baseStyle} ${colorStyle} bg-green-100 dark:bg-green-900/30 border-green-500`;
    }
    
    return `${baseStyle} ${colorStyle}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-4 flex-shrink-0">
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs sm:text-sm">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>
        <h1 className="text-base sm:text-xl font-semibold text-center flex-1 mx-2">Tic-Tac-Toe</h1>
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Game Settings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Game Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <Label className="text-sm font-medium">
                    {gameMode === 'pvp' ? '2 Players' : 'vs CPU'}
                  </Label>
                </div>
                <Switch
                  checked={gameMode === 'pvc'}
                  onCheckedChange={(checked) => {
                    const newMode = checked ? 'pvc' : 'pvp';
                    setGameMode(newMode);
                    resetScores();
                  }}
                />
                <div className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">CPU</span>
                </div>
              </div>

              {/* Difficulty Level */}
              {gameMode === 'pvc' && (
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    CPU Difficulty
                  </Label>
                  <Select value={difficulty} onValueChange={(value: Difficulty) => setDifficulty(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <Label className="text-sm font-medium">
                    Sound Effects
                  </Label>
                </div>
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>

              {/* Statistics Section */}
              {gameMode === 'pvc' && (
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowStats(!showStats)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {showStats ? 'Hide Statistics' : 'Show Statistics'}
                  </Button>
                  
                  {showStats && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-muted/30 rounded-lg border border-border/50">
                          <div className="text-xl font-semibold text-foreground">{gameStats.playerWins}</div>
                          <div className="text-xs text-muted-foreground">Your Wins</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg border border-border/50">
                          <div className="text-xl font-semibold text-foreground">{gameStats.cpuWins}</div>
                          <div className="text-xs text-muted-foreground">CPU Wins</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg border border-border/50">
                          <div className="text-xl font-semibold text-foreground">{gameStats.draws}</div>
                          <div className="text-xs text-muted-foreground">Draws</div>
                        </div>
                        <div className="text-center p-3 bg-muted/30 rounded-lg border border-border/50">
                          <div className="text-xl font-semibold text-foreground">{gameStats.currentStreak}</div>
                          <div className="text-xs text-muted-foreground">Current Streak</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border">
                        <div>
                          <div className="text-sm font-medium">Total Games: {gameStats.totalGames}</div>
                          <div className="text-xs text-muted-foreground">Best Streak: {gameStats.bestStreak}</div>
                        </div>
                        <Button variant="outline" size="sm" onClick={resetStats}>
                          Reset Stats
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* How to Play Section */}
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  {showInstructions ? 'Hide Instructions' : 'How to Play'}
                </Button>
                
                {showInstructions && (
                  <div className="space-y-2 text-xs sm:text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border border-border/50">
                    <ul className="space-y-1.5">
                      <li>• {gameMode === 'pvc' ? `${userName} plays as X, CPU plays as O` : 'Players take turns placing X\'s and O\'s'} on 3x3 grid</li>
                      <li>• First player to get 3 in a row (horizontal, vertical, or diagonal) wins</li>
                      <li>• If all 9 cells are filled without a winner, it's a draw</li>
                      <li>• {gameMode === 'pvc' ? 'CPU uses smart AI strategy' : 'Game works completely offline'} - no internet required!</li>
                      <li>• Your scores and preferences are saved automatically in local storage</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Main Game Content */}
      <div className="flex-1 flex flex-col justify-center items-center p-2 sm:p-4 pb-8">
        {/* Score Board */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 w-full max-w-72 sm:max-w-md mb-3 sm:mb-6">
          <Card className="text-center border-border/50 shadow-elevation-1">
            <CardContent className="pt-1.5 sm:pt-4 pb-1.5">
              <div className="text-lg sm:text-2xl font-semibold text-foreground">{xScore}</div>
              <div className="text-xs text-muted-foreground truncate">
                {gameMode === 'pvc' && playerSymbol === 'X' ? `${userName} (X)` : gameMode === 'pvc' ? 'CPU (X)' : 'Player X'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="text-center border-border/50 shadow-elevation-1">
            <CardContent className="pt-1.5 sm:pt-4 pb-1.5">
              <div className="text-sm sm:text-lg font-medium text-muted-foreground">VS</div>
            </CardContent>
          </Card>
          
          <Card className="text-center border-border/50 shadow-elevation-1">
            <CardContent className="pt-1.5 sm:pt-4 pb-1.5">
              <div className="text-lg sm:text-2xl font-semibold text-foreground">{oScore}</div>
              <div className="text-xs text-muted-foreground truncate">
                {gameMode === 'pvc' && playerSymbol === 'O' ? `${userName} (O)` : gameMode === 'pvc' ? 'CPU (O)' : 'Player O'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game Status */}
        <Card className="mb-3 sm:mb-6 w-full max-w-72 sm:max-w-md border-border/50 shadow-elevation-1">
          <CardContent className="pt-1.5 sm:pt-4 pb-1.5">
            <div className="text-center">
              <Badge variant={winner ? "default" : isDraw ? "secondary" : "outline"} className="text-xs sm:text-sm px-2 sm:px-4 py-1">
                {winner && <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}
                {getGameStatus()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Game Board */}
        <Card className="mb-3 sm:mb-6 w-full max-w-96 sm:max-w-md border-border/50 shadow-elevation-1">
          <CardContent className="pt-2 sm:pt-6 pb-2">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-80 sm:max-w-sm mx-auto">
              {board.map((cell, index) => (
                <button
                  key={index}
                  onClick={() => handleCellClick(index)}
                  className={getCellStyle(index)}
                  disabled={!!cell || !!winner || isDraw}
                >
                  {cell}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Control Buttons */}
        <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-4 justify-center w-full max-w-72 sm:max-w-md">
          <Button onClick={resetGame} className="flex items-center justify-center gap-2 w-full text-xs sm:text-sm">
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
            New Game
          </Button>
          <Button variant="outline" onClick={resetScores} className="w-full text-xs sm:text-sm">
            Reset Scores
          </Button>
        </div>

        {/* Storage Info */}
        <div className="text-center mt-1.5 sm:mt-4">
          <p className="text-xs text-muted-foreground">
            Scores are automatically saved locally...
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicTacToe;
