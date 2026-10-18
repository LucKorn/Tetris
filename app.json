import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 40) / BOARD_WIDTH);

export default function TetrisGame() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(getRandomTetromino());
  const [position, setPosition] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Iniciar novo jogo
  const resetGame = () => {
    setBoard(createEmptyBoard());
    setScore(0);
    setLines(0);
    setGameOver(false);
    setIsPaused(false);
    const firstPiece = getRandomTetromino();
    const secondPiece = getRandomTetromino();
    setCurrentPiece(firstPiece);
    setNextPiece(secondPiece);
    setPosition({ x: Math.floor((BOARD_WIDTH - firstPiece.shape[0].length) / 2), y: 0 });
  };

  useEffect(() => {
    resetGame();
  }, []);

  // Verificar colisões
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

  // Rodar matriz
  const rotateMatrix = (matrix) => {
    return matrix[0].map((_, index) => matrix.map((col) => col[index]).reverse());
  };

  // Mover para os lados
  const move = (dir) => {
    if (gameOver || isPaused || !currentPiece) return;
    const newPos = { ...position, x: position.x + dir };
    if (!checkCollision(currentPiece, newPos)) {
      setPosition(newPos);
    }
  };

  // Rodar peça
  const rotate = () => {
    if (gameOver || isPaused || !currentPiece) return;
    const rotatedShape = rotateMatrix(currentPiece.shape);
    const rotatedPiece = { ...currentPiece, shape: rotatedShape };
    if (!checkCollision(rotatedPiece, position)) {
      setCurrentPiece(rotatedPiece);
    }
  };

  // Fixar peça no tabuleiro e limpar linhas
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

    // Verificar e remover linhas completas
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

    // Próxima peça
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

  // Descer peça
  const drop = useCallback(() => {
    if (gameOver || isPaused || !currentPiece) return;
    const newPos = { ...position, y: position.y + 1 };
    if (!checkCollision(currentPiece, newPos)) {
      setPosition(newPos);
    } else {
      lockPiece();
    }
  }, [gameOver, isPaused, currentPiece, position, checkCollision, lockPiece]);

  // Hard Drop (Descer tudo)
  const hardDrop = () => {
    if (gameOver || isPaused || !currentPiece) return;
    let currentY = position.y;
    while (!checkCollision(currentPiece, { x: position.x, y: currentY + 1 })) {
      currentY++;
    }
    setPosition({ x: position.x, y: currentY });
    // Forçar fixação na posição final
    setTimeout(() => drop(), 50);
  };

  // Loop do jogo (Game Loop)
  useEffect(() => {
    if (gameOver || isPaused) return;
    const interval = setInterval(() => {
      drop();
    }, 700);
    return () => clearInterval(interval);
  }, [drop, gameOver, isPaused]);

  // Desenhar tabuleiro fundido com a peça atual
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
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>PONTOS</Text>
          <Text style={styles.infoValue}>{score}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={resetGame}>
          <Text style={styles.buttonText}>{gameOver ? 'Reiniciar' : 'Novo Jogo'}</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>LINHAS</Text>
          <Text style={styles.infoValue}>{lines}</Text>
        </View>
      </View>

      {/* Tabuleiro */}
      <View style={styles.boardContainer}>
        {renderBoard().map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <View
                key={colIndex}
                style={[
                  styles.cell,
                  { backgroundColor: cell === 0 ? '#111827' : cell },
                ]}
              />
            ))}
          </View>
        ))}

        {gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.gameOverText}>GAME OVER</Text>
          </View>
        )}
      </View>

      {/* Controlos virtuais */}
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={rotate}>
            <Text style={styles.btnText}>↻</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={() => move(-1)}>
            <Text style={styles.btnText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, styles.dropBtn]} onPress={hardDrop}>
            <Text style={styles.btnText}>⇓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => move(1)}>
            <Text style={styles.btnText}>→</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={drop}>
            <Text style={styles.btnText}>↓</Text>
          </TouchableOpacity>
        </View>
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
    width: '90%',
    paddingHorizontal: 10,
  },
  infoBox: {
    alignItems: 'center',
  },
  infoTitle: {
    color: '#9ca3af',
    fontSize: 12,
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
    borderColor: '#374151',
    backgroundColor: '#111827',
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 1,
    borderColor: '#1f2937',
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
  controls: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 10,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginVertical: 4,
  },
  controlBtn: {
    width: 60,
    height: 60,
    backgroundColor: '#1f2937',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  dropBtn: {
    backgroundColor: '#d97706',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
