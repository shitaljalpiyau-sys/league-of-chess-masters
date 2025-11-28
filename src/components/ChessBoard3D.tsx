import { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { Chess, Square } from 'chess.js';
import * as THREE from 'three';

interface ChessBoard3DProps {
  chess: Chess;
  playerColor?: 'white' | 'black';
  isPlayerTurn?: boolean;
  onMove?: (from: string, to: string) => Promise<boolean>;
  themeColors?: {
    lightSquare: string;
    darkSquare: string;
  };
}

// 3D Chess Piece Component
const ChessPiece3D = ({ 
  type, 
  color, 
  position, 
  onClick,
  isSelected,
  pieceScale = 0.4
}: { 
  type: string; 
  color: string; 
  position: [number, number, number];
  onClick?: () => void;
  isSelected?: boolean;
  pieceScale?: number;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (groupRef.current && isSelected) {
      groupRef.current.position.y = position[1] + 0.2;
    } else if (groupRef.current) {
      groupRef.current.position.y = position[1];
    }
  }, [isSelected, position]);

  const pieceColor = color === 'w' ? '#f5f5f5' : '#1a1a1a';
  const emissiveColor = color === 'w' ? '#ffffff' : '#000000';

  // Different geometries for different pieces
  const getPieceGeometry = () => {
    switch (type) {
      case 'k': // King
        return (
          <group>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.15, 0.25, 0.6, 16]} />
              <meshStandardMaterial 
                color={pieceColor} 
                metalness={0.3} 
                roughness={0.4}
                emissive={emissiveColor}
                emissiveIntensity={0.1}
              />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[0.1, 0.3, 0.1]} />
              <meshStandardMaterial 
                color={pieceColor} 
                metalness={0.3} 
                roughness={0.4}
              />
            </mesh>
            <mesh position={[0, 0.65, 0]}>
              <boxGeometry args={[0.25, 0.05, 0.1]} />
              <meshStandardMaterial 
                color={pieceColor} 
                metalness={0.3} 
                roughness={0.4}
              />
            </mesh>
          </group>
        );
      case 'q': // Queen
        return (
          <group>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.15, 0.25, 0.6, 16]} />
              <meshStandardMaterial 
                color={pieceColor} 
                metalness={0.3} 
                roughness={0.4}
                emissive={emissiveColor}
                emissiveIntensity={0.1}
              />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial 
                color={pieceColor} 
                metalness={0.3} 
                roughness={0.4}
              />
            </mesh>
          </group>
        );
      case 'r': // Rook
        return (
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.3, 0.6, 0.3]} />
            <meshStandardMaterial 
              color={pieceColor} 
              metalness={0.3} 
              roughness={0.4}
              emissive={emissiveColor}
              emissiveIntensity={0.1}
            />
          </mesh>
        );
      case 'b': // Bishop
        return (
          <group>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.12, 0.2, 0.5, 16]} />
              <meshStandardMaterial 
                color={pieceColor} 
                metalness={0.3} 
                roughness={0.4}
                emissive={emissiveColor}
                emissiveIntensity={0.1}
              />
            </mesh>
            <mesh position={[0, 0.45, 0]}>
              <coneGeometry args={[0.12, 0.3, 16]} />
              <meshStandardMaterial 
                color={pieceColor} 
                metalness={0.3} 
                roughness={0.4}
              />
            </mesh>
          </group>
        );
      case 'n': // Knight
        return (
          <group>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.15, 0.2, 0.4, 16]} />
              <meshStandardMaterial 
                color={pieceColor} 
                metalness={0.3} 
                roughness={0.4}
                emissive={emissiveColor}
                emissiveIntensity={0.1}
              />
            </mesh>
            <mesh position={[0, 0.4, 0.1]} rotation={[Math.PI / 6, 0, 0]}>
              <boxGeometry args={[0.2, 0.4, 0.15]} />
              <meshStandardMaterial 
                color={pieceColor} 
                metalness={0.3} 
                roughness={0.4}
              />
            </mesh>
          </group>
        );
      case 'p': // Pawn
        return (
          <group>
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.1, 0.15, 0.3, 16]} />
              <meshStandardMaterial 
                color={pieceColor} 
                metalness={0.3} 
                roughness={0.4}
                emissive={emissiveColor}
                emissiveIntensity={0.1}
              />
            </mesh>
            <mesh position={[0, 0.28, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial 
                color={pieceColor} 
                metalness={0.3} 
                roughness={0.4}
              />
            </mesh>
          </group>
        );
      default:
        return null;
    }
  };

  return (
    <group 
      ref={groupRef}
      position={position}
      scale={pieceScale}
      onClick={onClick}
    >
      {getPieceGeometry()}
      {isSelected && (
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.05, 32]} />
          <meshStandardMaterial 
            color="#ffd700" 
            transparent 
            opacity={0.6}
            emissive="#ffd700"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
};

// Chess Square Component
const ChessSquare3D = ({ 
  position, 
  isLight, 
  isSelected,
  isLegalMove,
  onClick,
  lightColor = '#f0d9b5',
  darkColor = '#b58863'
}: {
  position: [number, number, number];
  isLight: boolean;
  isSelected?: boolean;
  isLegalMove?: boolean;
  onClick?: () => void;
  lightColor?: string;
  darkColor?: string;
}) => {
  const baseColor = isLight ? lightColor : darkColor;
  const emissiveColor = isSelected ? '#ffd700' : (isLegalMove ? '#00ff00' : '#000000');
  
  return (
    <mesh 
      position={position} 
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={onClick}
      receiveShadow
    >
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial 
        color={baseColor}
        metalness={0.2}
        roughness={0.8}
        emissive={emissiveColor}
        emissiveIntensity={isSelected ? 0.3 : (isLegalMove ? 0.2 : 0)}
      />
    </mesh>
  );
};

export const ChessBoard3D = ({ 
  chess, 
  playerColor = 'white',
  isPlayerTurn = true,
  onMove,
  themeColors
}: ChessBoard3DProps) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);

  const board = chess.board();
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const lightSquareColor = themeColors?.lightSquare || '#f0d9b5';
  const darkSquareColor = themeColors?.darkSquare || '#b58863';

  const handleSquareClick = async (square: Square) => {
    if (!isPlayerTurn) return;

    if (!selectedSquare) {
      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        const moves = chess.moves({ square, verbose: true });
        setSelectedSquare(square);
        setLegalMoves(moves.map(m => m.to as Square));
      }
    } else {
      if (legalMoves.includes(square)) {
        if (onMove) {
          const success = await onMove(selectedSquare, square);
          if (success) {
            setSelectedSquare(null);
            setLegalMoves([]);
          }
        }
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    }
  };

  const getSquarePosition = (file: string, rank: string): [number, number, number] => {
    const fileIndex = files.indexOf(file);
    const rankIndex = ranks.indexOf(rank);
    return [fileIndex - 3.5, 0, rankIndex - 3.5];
  };

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border-4 border-border shadow-2xl bg-background">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 8, 8]} fov={50} />
        <OrbitControls 
          enablePan={false}
          minDistance={6}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-10, 10, -5]} intensity={0.5} />
        
        {/* Environment for reflections */}
        <Environment preset="city" />

        {/* Chess Board */}
        <group>
          {/* Squares */}
          {ranks.map((rank) =>
            files.map((file) => {
              const square = `${file}${rank}` as Square;
              const fileIndex = files.indexOf(file);
              const rankIndex = ranks.indexOf(rank);
              const isLight = (fileIndex + parseInt(rank)) % 2 === 0;
              const position = getSquarePosition(file, rank);
              const isSelected = selectedSquare === square;
              const isLegalMove = legalMoves.includes(square);

              return (
                <ChessSquare3D
                  key={square}
                  position={position}
                  isLight={isLight}
                  isSelected={isSelected}
                  isLegalMove={isLegalMove}
                  onClick={() => handleSquareClick(square)}
                  lightColor={lightSquareColor}
                  darkColor={darkSquareColor}
                />
              );
            })
          )}

          {/* Board Frame */}
          <mesh position={[0, -0.1, 0]} receiveShadow>
            <boxGeometry args={[9, 0.2, 9]} />
            <meshStandardMaterial 
              color="#2a2a2a" 
              metalness={0.5}
              roughness={0.5}
            />
          </mesh>

          {/* Chess Pieces */}
          {ranks.map((rank) =>
            files.map((file) => {
              const square = `${file}${rank}` as Square;
              const piece = board[8 - parseInt(rank)][files.indexOf(file)];
              
              if (!piece) return null;

              const position = getSquarePosition(file, rank);
              position[1] = 0.05; // Lift pieces slightly above board
              
              return (
                <ChessPiece3D
                  key={`${square}-${piece.type}-${piece.color}`}
                  type={piece.type}
                  color={piece.color}
                  position={position}
                  onClick={() => handleSquareClick(square)}
                  isSelected={selectedSquare === square}
                />
              );
            })
          )}

          {/* Legal move indicators */}
          {legalMoves.map((move) => {
            const file = move[0];
            const rank = move[1];
            const position = getSquarePosition(file, rank);
            position[1] = 0.1;
            
            return (
              <mesh key={move} position={position}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshStandardMaterial 
                  color="#00ff00" 
                  transparent 
                  opacity={0.6}
                  emissive="#00ff00"
                  emissiveIntensity={0.5}
                />
              </mesh>
            );
          })}
        </group>
      </Canvas>
    </div>
  );
};