declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        createOrder: () => Promise<string> | string;
        onApprove: (data: { orderID?: string }) => Promise<void> | void;
        onCancel?: () => void;
        onError?: (error: unknown) => void;
        style?: Record<string, unknown>;
      }) => {
        render: (selector: string) => Promise<void> | void;
        close?: () => Promise<void> | void;
      };
      HostedButtons: (options: { hostedButtonId: string }) => {
        render: (selector: string) => Promise<void> | void;
      };
    };
  }
}

export {};
