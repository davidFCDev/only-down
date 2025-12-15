/**
 * Global type declarations for externally loaded libraries
 */

// Phaser is loaded globally via CDN
declare const Phaser: typeof import('phaser')

// Import the actual SDK types from the package
import type { FarcadeSDK as FarcadeSDKType } from '@farcade/game-sdk'

// Extended Farcade SDK with purchase/credits features
interface ExtendedFarcadeSDK extends FarcadeSDKType {
  hasItem?: (itemId: string) => boolean;
  purchase?: (options: { item: string }) => Promise<{ success: boolean }>;
  onPurchaseComplete?: (callback: () => void) => void;
}

// Farcade SDK is loaded globally via CDN
declare const FarcadeSDK: ExtendedFarcadeSDK

// Extend window for global SDK access
declare global {
  interface Window {
    FarcadeSDK?: ExtendedFarcadeSDK
  }
}

export {}
