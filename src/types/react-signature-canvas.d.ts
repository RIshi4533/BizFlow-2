declare module 'react-signature-canvas' {
  import * as React from 'react';

  export interface SignatureCanvasProps {
    penColor?: string;
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    [key: string]: any;
  }

  export default class SignatureCanvas extends React.Component<SignatureCanvasProps> {
    clear(): void;
    isEmpty(): boolean;
    toDataURL(mimeType?: string, encoderOptions?: any): string;
    fromDataURL(dataURL: string, options?: any): void;
    getTrimmedCanvas(): HTMLCanvasElement;
  }
}
