/// <reference types="vite/client" />

declare module '*?raw' {
  const content: string;
  export default content;
}

declare const __APP_BUILD_TIME__: number;
declare const __APP_VERSION__: string;
