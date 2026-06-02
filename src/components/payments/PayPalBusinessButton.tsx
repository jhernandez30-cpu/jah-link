import PayPalHostedButton from './PayPalHostedButton';
import { PAYPAL_HOSTED_BUTTONS } from '../../lib/paypal';

export default function PayPalBusinessButton({ className = '' }: { className?: string }) {
  return (
    <PayPalHostedButton
      plan="business"
      hostedButtonId={PAYPAL_HOSTED_BUTTONS.business}
      className={className}
    />
  );
}
