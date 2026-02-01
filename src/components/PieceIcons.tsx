import React from 'react';
import type { PieceType, PlayerColor } from '../types/game';

interface PieceIconProps {
  type: PieceType;
  color: PlayerColor;
  className?: string;
}

const WhitePawn = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 45 45" className={className} fill="white" stroke="black" strokeWidth="1.5">
    <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
  </svg>
);

const WhiteKnight = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 45 45" className={className} fill="white" stroke="black" strokeWidth="1.5">
    <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
    <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" />
  </svg>
);

const WhiteBishop = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 45 45" className={className} fill="white" stroke="black" strokeWidth="1.5">
    <g transform="translate(1,0) scale(0.95)">
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 38.15,38.99 38.5,40 C 38.5,40 25.5,40 25.5,40 L 19.5,40 C 19.5,40 6.5,40 6.5,40 C 6.85,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z" />
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,25 30,25 C 30,25 20,25 20,25 C 20,25 14.5,30.5 15,32 z" />
        <path d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" />
        <path d="M 17.5,26 L 27.5,26 L 27.5,23 L 17.5,23 L 17.5,26 z" />
        <path d="M 15,24 C 15,24 20.5,15.5 22.5,15 C 24.5,14.5 26.5,18.5 26.5,18.5 L 30,18.5 L 30,23 C 30,23 30,24 30,24 L 15,24 z" />
    </g>
  </svg>
);

const WhiteRook = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 45 45" className={className} fill="white" stroke="black" strokeWidth="1.5">
    <g transform="translate(0,0)">
       <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z " />
       <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z " />
       <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
       <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
       <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
       <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
       <path d="M 11,14 L 34,14" />
    </g>
  </svg>
);

const WhiteQueen = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 45 45" className={className} fill="white" stroke="black" strokeWidth="1.5">
    <g transform="translate(0,0)">
      <path d="M 8 12 C 8 11.5 8.5 11 9 11 C 9.5 11 10 11.5 10 12 L 11 20.5 L 17 11 L 17 12 C 17 12.5 17.5 13 18 13 C 18.5 13 19 12.5 19 12 L 20.5 21 L 25 12 C 25 11.5 25.5 11 26 11 C 26.5 11 27 11.5 27 12 L 27 11 L 33 21 L 34 11.5 C 34 11 34.5 10.5 35 10.5 C 35.5 10.5 36 11 36 11.5 L 37 19 L 37 39 L 8 39 L 8 12 z " />
      <path d="M 11 39 L 34 39 L 34 35 L 11 35 L 11 39 z " />
      <circle cx="6" cy="12" r="2" />
      <circle cx="14" cy="9" r="2" />
      <circle cx="22.5" cy="8" r="2" />
      <circle cx="31" cy="9" r="2" />
      <circle cx="39" cy="12" r="2" />
    </g>
  </svg>
);

const WhiteKing = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 45 45" className={className} fill="white" stroke="black" strokeWidth="1.5">
    <g transform="translate(0,0)">
       <path d="M 22.5,11.63 L 22.5,6" />
       <path d="M 20,8 L 25,8" />
       <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
       <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37" />
       <path d="M 11.5,30 C 17,27 27,27 32.5,30" />
       <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" />
       <path d="M 11.5,37 C 17,34 27,34 32.5,37" />
    </g>
  </svg>
);

const BlackPawn = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 45 45" className={className} fill="black" stroke="white" strokeWidth="1.5">
    <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
  </svg>
);

const BlackKnight = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 45 45" className={className} fill="black" stroke="white" strokeWidth="1.5">
    <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
    <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" />
  </svg>
);

const BlackBishop = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 45 45" className={className} fill="black" stroke="white" strokeWidth="1.5">
    <g transform="translate(1,0) scale(0.95)">
        <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 38.15,38.99 38.5,40 C 38.5,40 25.5,40 25.5,40 L 19.5,40 C 19.5,40 6.5,40 6.5,40 C 6.85,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z" />
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,25 30,25 C 30,25 20,25 20,25 C 20,25 14.5,30.5 15,32 z" />
        <path d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" />
        <path d="M 17.5,26 L 27.5,26 L 27.5,23 L 17.5,23 L 17.5,26 z" />
        <path d="M 15,24 C 15,24 20.5,15.5 22.5,15 C 24.5,14.5 26.5,18.5 26.5,18.5 L 30,18.5 L 30,23 C 30,23 30,24 30,24 L 15,24 z" />
    </g>
  </svg>
);

const BlackRook = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 45 45" className={className} fill="black" stroke="white" strokeWidth="1.5">
    <g transform="translate(0,0)">
       <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z " />
       <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z " />
       <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
       <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
       <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
       <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
       <path d="M 11,14 L 34,14" />
    </g>
  </svg>
);

const BlackQueen = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 45 45" className={className} fill="black" stroke="white" strokeWidth="1.5">
    <g transform="translate(0,0)">
      <path d="M 8 12 C 8 11.5 8.5 11 9 11 C 9.5 11 10 11.5 10 12 L 11 20.5 L 17 11 L 17 12 C 17 12.5 17.5 13 18 13 C 18.5 13 19 12.5 19 12 L 20.5 21 L 25 12 C 25 11.5 25.5 11 26 11 C 26.5 11 27 11.5 27 12 L 27 11 L 33 21 L 34 11.5 C 34 11 34.5 10.5 35 10.5 C 35.5 10.5 36 11 36 11.5 L 37 19 L 37 39 L 8 39 L 8 12 z " />
      <path d="M 11 39 L 34 39 L 34 35 L 11 35 L 11 39 z " />
      <circle cx="6" cy="12" r="2" />
      <circle cx="14" cy="9" r="2" />
      <circle cx="22.5" cy="8" r="2" />
      <circle cx="31" cy="9" r="2" />
      <circle cx="39" cy="12" r="2" />
    </g>
  </svg>
);

const BlackKing = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 45 45" className={className} fill="black" stroke="white" strokeWidth="1.5">
    <g transform="translate(0,0)">
       <path d="M 22.5,11.63 L 22.5,6" />
       <path d="M 20,8 L 25,8" />
       <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
       <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37" />
       <path d="M 11.5,30 C 17,27 27,27 32.5,30" />
       <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" />
       <path d="M 11.5,37 C 17,34 27,34 32.5,37" />
    </g>
  </svg>
);

const ICONS: Record<string, React.FC<{ className?: string }>> = {
  'wp': WhitePawn,
  'wn': WhiteKnight,
  'wb': WhiteBishop,
  'wr': WhiteRook,
  'wq': WhiteQueen,
  'wk': WhiteKing,
  'bp': BlackPawn,
  'bn': BlackKnight,
  'bb': BlackBishop,
  'br': BlackRook,
  'bq': BlackQueen,
  'bk': BlackKing,
};

export const PieceIcon = ({ type, color, className }: PieceIconProps) => {
  const Icon = ICONS[`${color}${type}`];
  return Icon ? <Icon className={className} /> : null;
};
