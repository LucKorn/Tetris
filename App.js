import React, { useState, useEffect, useCallback } from 'react';
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
  J: { shape: [[1,0,0],[1,1,1],[0,0,0]], color: '#0000f0' },
  L: { shape: [[0,0,1],[1,1,1],[0,0,0]], color: '#f0a000' },
  O: { shape: [[1,1],[1,1]], color: '#f0f000' },
  S: { shape: [[0,1,1],[1,1,0],[0,0,0]], color: '#00f000' },
  T: { shape: [[0,1,0],[1,1,1],[0,0,0]], color: '#a000f0' },
  Z: { shape: [[1,1,0],[0,1,1],[0,0,0]], color: '#f00000' },
};

const getRandomTetromino = () => {
  const keys = Object.keys(TETROMINOS);
  const randKey = keys[Math.floor(Math.random() * keys.length)];
  return TETROMINOS[randKey];
};

const createEmptyBoard = () =>
  Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Ajuste dinâmico do tamanho das células para dar espaço de sobra aos botões em baixo
const CELL_SIZE = Math.min(
  Math.floor((SCREEN_WIDTH - 40) / BOARD_WIDTH),
  Math.floor((SCREEN_HEIGHT * 0.55) / BOARD_HEIGHT)
);

export default function App() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(getRandomTetromino());
  const [position, setPosition] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const resetGame = () => {
    setBoard(createEmptyBoard());
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

  const checkCollision = useCallback(
    (piece, pos, currentBoard = board) => {
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
    },
    [board]
  );

  const rotateMatrix = (matrix) => {
    return matrix[0].map((_, index) => matrix.map((col) => col[index]).reverse());
  };

  const move = (dir) => {
    if (gameOver || !currentPiece) return;
    const newPos = { ...position, x: position.x + dir };
    if (!checkCollision(currentPiece, newPos)) {
      setPosition(newPos);
    }
  };

  const rotate = () => {
    if (gameOver || !currentPiece) return;
    const rotatedShape = rotateMatrix(currentPiece.shape);
    const rotatedPiece = { ...currentPiece, shape: rotatedShape };
    if (!checkCollision(rotatedPiece, position)) {
      setCurrentPiece(rotatedPiece);
    }
  };

  const lockPiece = useCallback(() => {
    const newBoard = board.map((row) => [...row]);
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c] !== 0) {
          const boardY = position.y + r;
          const boardX = position.x + c;
          if (boardY >= 0 && boardY < BOARD_HEIGHT) {
            newBoard[boardY][boardX] = currentPiece.color;
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
  }, [board, currentPiece, nextPiece, position, checkCollision]);

  const drop = useCallback(() => {
    if (gameOver || !currentPiece) return;
    const newPos = { ...position, y: position.y + 1 };
    if (!checkCollision(currentPiece, newPos)) {
      setPosition(newPos);
    } else {
      lockPiece();
    }
  }, [gameOver, currentPiece, position, checkCollision, lockPiece]);

  const hardDrop = () => {
    if (gameOver || !currentPiece) return;
    let currentY = position.y;
    while (!checkCollision(currentPiece, { x: position.x, y: currentY + 1 })) {
      currentY++;
    }
    setPosition({ x: position.x, y: currentY });
    setTimeout(() => drop(), 40);
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

      {/* Topo / Placar */}
      <View style={styles.header}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>PONTOS</Text>
          <Text style={styles.infoValue}>{score}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={resetGame}>
          <Text style={styles.buttonText}>{gameOver ? 'Recomeçar' : 'Novo Jogo'}</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>LINHAS</Text>
          <Text style={styles.infoValue}>{lines}</Text>
        </View>
      </View>

      {/* Tabuleiro do Tetris */}
      <View style={styles.boardContainer}>
        {renderBoard().map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <View
                key={colIndex}
                style={[
                  styles.cell,
                  { backgroundColor: cell === 0 ? '#0f172a' : cell },
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

      {/* Barra Inferior com os Botões de Controlo */}
      <View style={styles.controlsBar}>
        <TouchableOpacity style={styles.btn} onPress={() => move(-1)}>
          <Text style={styles.btnText}>◄</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={rotate}>
          <Text style={styles.btnText}>↻</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.dropBtn]} onPress={hardDrop}>
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
    paddingVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '92%',
    marginTop: 5,
  },
  infoBox: {
    alignItems: 'center',
  },
  infoTitle: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  boardContainer: {
    borderWidth: 2,
    borderColor: '#1e293b',
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverText: {
    color: '#ef4444',
    fontSize: 26,
    fontWeight: 'bold',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    paddingBottom: 15,
    backgroundColor: '#090d16',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  btn: {
    width: 58,
    height: 58,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 4,
  },
  dropBtn: {
    backgroundColor: '#d97706',
    borderColor: '#f59e0b',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
});
                                                  
