import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const TETROMINOS = {
  I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: '#00f0f0' },
  J: { shape: [[1,0,0],[1,1,1],[0,0,0]], color: '#2563eb' },
  L: { shape: [[0,0,1],[1,1,1],[0,0,0]], color: '#f97316' },
  O: { shape: [[1,1],[1,1]], color: '#facc15' },
  S: { shape: [[0,1,1],[1,1,0],[0,0,0]], color: '#22c55e' },
  T: { shape: [[0,1,0],[1,1,1],[0,0,0]], color: '#a855f7' },
  Z: { shape: [[1,1,0],[0,1,1],[0,0,0]], color: '#ef4444' },
};

const getRandomTetromino = () => {
  const keys = Object.keys(TETROMINOS);
  const randKey = keys[Math.floor(Math.random() * keys.length)];
  return TETROMINOS[randKey];
};

const createEmptyBoard = () =>
  Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Ocupa o máximo de espaço horizontal e vertical disponível
const MAX_BOARD_WIDTH = SCREEN_WIDTH - 20;
const MAX_BOARD_HEIGHT = SCREEN_HEIGHT - 220; // Garante espaço para o topo e botões

const CELL_SIZE = Math.floor(
  Math.min(MAX_BOARD_WIDTH / BOARD_WIDTH, MAX_BOARD_HEIGHT / BOARD_HEIGHT)
);

export default function App() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(getRandomTetromino());
  const [position, setPosition] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Refs para ler estado atualizado em funções assíncronas
  const stateRef = useRef();
  stateRef.current = { board, currentPiece, position, nextPiece, gameOver };

  const resetGame = () => {
    const emptyBoard = createEmptyBoard();
    setBoard(emptyBoard);
    setScore(0);
    setLines(0);
    setGameOver(false);
    const firstPiece = getRandomTetromino();
    const secondPiece = getRandomTetromino();
    setCurrentPiece(firstPiece);
    setNextPiece(secondPiece);
    setPosition({ x: Math.floor((BOARD_WIDTH - firstPiece.shape[0].length) / 2), y: 0 });
  };

  useEffect(() => {
    resetGame();
  }, []);

  const checkCollision = useCallback((piece, pos, currentBoard) => {
    if (!piece) return false;
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c] !== 0) {
          const newX = pos.x + c;
          const newY = pos.y + r;
          if (
            newX < 0 ||
            newX >= BOARD_WIDTH ||
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && currentBoard[newY][newX] !== 0)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const rotateMatrix = (matrix) => {
    return matrix[0].map((_, index) => matrix.map((col) => col[index]).reverse());
  };

  const move = (dir) => {
    const { currentPiece, position, board, gameOver } = stateRef.current;
    if (gameOver || !currentPiece) return;
    const newPos = { ...position, x: position.x + dir };
    if (!checkCollision(currentPiece, newPos, board)) {
      setPosition(newPos);
    }
  };

  const rotate = () => {
    const { currentPiece, position, board, gameOver } = stateRef.current;
    if (gameOver || !currentPiece) return;
    const rotatedShape = rotateMatrix(currentPiece.shape);
    const rotatedPiece = { ...currentPiece, shape: rotatedShape };
    if (!checkCollision(rotatedPiece, position, board)) {
      setCurrentPiece(rotatedPiece);
    }
  };

  const lockPieceAtPosition = (pieceToLock, finalPos) => {
    const { board, nextPiece } = stateRef.current;
    const newBoard = board.map((row) => [...row]);

    for (let r = 0; r < pieceToLock.shape.length; r++) {
      for (let c = 0; c < pieceToLock.shape[r].length; c++) {
        if (pieceToLock.shape[r][c] !== 0) {
          const boardY = finalPos.y + r;
          const boardX = finalPos.x + c;
          if (boardY >= 0 && boardY < BOARD_HEIGHT) {
            newBoard[boardY][boardX] = pieceToLock.color;
          }
        }
      }
    }

    let clearedLines = 0;
    const filteredBoard = newBoard.filter((row) => {
      const isFull = row.every((cell) => cell !== 0);
      if (isFull) clearedLines++;
      return !isFull;
    });

    while (filteredBoard.length < BOARD_HEIGHT) {
      filteredBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }

    if (clearedLines > 0) {
      setLines((prev) => prev + clearedLines);
      setScore((prev) => prev + clearedLines * 100 * clearedLines);
    }

    setBoard(filteredBoard);

    const newPiece = nextPiece;
    const upcomingPiece = getRandomTetromino();
    const newPos = { x: Math.floor((BOARD_WIDTH - newPiece.shape[0].length) / 2), y: 0 };

    if (checkCollision(newPiece, newPos, filteredBoard)) {
      setGameOver(true);
    } else {
      setCurrentPiece(newPiece);
      setNextPiece(upcomingPiece);
      setPosition(newPos);
    }
  };

  const drop = useCallback(() => {
    const { currentPiece, position, board, gameOver } = stateRef.current;
    if (gameOver || !currentPiece) return;

    const newPos = { ...position, y: position.y + 1 };
    if (!checkCollision(currentPiece, newPos, board)) {
      setPosition(newPos);
    } else {
      lockPieceAtPosition(currentPiece, position);
    }
  }, [checkCollision]);

  // Ação do Botão Laranja: Descer a peça diretamente até ao fundo
  const hardDrop = () => {
    const { currentPiece, position, board, gameOver } = stateRef.current;
    if (gameOver || !currentPiece) return;

    let currentY = position.y;
    while (!checkCollision(currentPiece, { x: position.x, y: currentY + 1 }, board)) {
      currentY++;
    }

    const finalPos = { x: position.x, y: currentY };
    setPosition(finalPos);
    lockPieceAtPosition(currentPiece, finalPos);
  };

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      drop();
    }, 700);
    return () => clearInterval(interval);
  }, [drop, gameOver]);

  const renderBoard = () => {
    const displayBoard = board.map((row) => [...row]);
    if (currentPiece && !gameOver) {
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c] !== 0) {
            const y = position.y + r;
            const x = position.x + c;
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
              displayBoard[y][x] = currentPiece.color;
            }
          }
        }
      }
    }
    return displayBoard;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Topo / Placar Super Visível */}
      <View style={styles.header}>
        <View style={[styles.scoreCard, styles.pointsBorder]}>
          <Text style={styles.scoreLabel}>PONTOS</Text>
          <Text style={[styles.scoreValue, styles.yellowText]}>{score}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={resetGame}>
          <Text style={styles.buttonText}>{gameOver ? 'RECOMEÇAR' : 'NOVO JOGO'}</Text>
        </TouchableOpacity>

        <View style={[styles.scoreCard, styles.linesBorder]}>
          <Text style={styles.scoreLabel}>LINHAS</Text>
          <Text style={[styles.scoreValue, styles.cyanText]}>{lines}</Text>
        </View>
      </View>

      {/* Quadro Expandido do Jogo */}
      <View style={styles.boardWrapper}>
        <View style={styles.boardContainer}>
          {renderBoard().map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell, colIndex) => (
                <View
                  key={colIndex}
                  style={[
                    styles.cell,
                    { backgroundColor: cell === 0 ? '#0b1329' : cell },
                  ]}
                />
              ))}
            </View>
          ))}

          {gameOver && (
            <View style={styles.overlay}>
              <Text style={styles.gameOverText}>FIM DE JOGO</Text>
            </View>
          )}
        </View>
      </View>

      {/* Barra de Controlos */}
      <View style={styles.controlsBar}>
        <TouchableOpacity style={styles.btn} onPress={() => move(-1)}>
          <Text style={styles.btnText}>◄</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={rotate}>
          <Text style={styles.btnText}>↻</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.hardDropBtn]} onPress={hardDrop}>
          <Text style={styles.btnText}>⬇</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={drop}>
          <Text style={styles.btnText}>▼</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={() => move(1)}>
          <Text style={styles.btnText}>►</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '94%',
    marginTop: 4,
  },
  scoreCard: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 85,
    borderWidth: 1.5,
  },
  pointsBorder: {
    borderColor: '#eab308',
  },
  linesBorder: {
    borderColor: '#06b6d4',
  },
  scoreLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  yellowText: {
    color: '#facc15',
  },
  cyanText: {
    color: '#22d3ee',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  boardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  boardContainer: {
    borderWidth: 2,
    borderColor: '#1e293b',
    backgroundColor: '#0b1329',
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverText: {
    color: '#ef4444',
    fontSize: 28,
    fontWeight: 'bold',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    paddingBottom: 12,
    paddingTop: 10,
    backgroundColor: '#090d16',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  btn: {
    width: 60,
    height: 60,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  hardDropBtn: {
    backgroundColor: '#d97706',
    borderColor: '#f59e0b',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
