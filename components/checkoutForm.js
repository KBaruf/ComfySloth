import React from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCartContext } from '../context/cart_context';
import { formatPrice } from '../utils/helpers';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { cart, total_amount, shipping_fee, clearCart } = useCartContext();

  React.useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get('payment_intent_client_secret');

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage('Payment succeeded!');
          break;
        case 'processing':
          setMessage('Your payment is processing.');
          break;
        case 'requires_payment_method':
          setMessage('Your payment was not successful, please try again.');
          break;
        default:
          setMessage('Something went wrong.');
          break;
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: 'https://comfysloth.vercel.app/paymentSuccess',
        shipping: {
          address: { city: 'NY' },
          name: 'Shipping user',
        },
        payment_method_data: {
          billing_details: {
            name: 'Billing user',
          },
        },
      },
    });
    if (error.type === 'card_error' || error.type === 'validation_error') {
      setMessage(error.message);
    } else {
      setMessage('An unexpected error occurred.');
    }

    setIsLoading(false);
  };

  return (
    <form id='payment-form' onSubmit={handleSubmit} className='m-auto'>
      <article>
        <h3>Your total is {formatPrice(shipping_fee + total_amount)} </h3>
        <p>Test Card#: 4242 4242 4242 4242 </p>
        <p>(Ex date: 12/34 ) (CVV: 333)</p>
      </article>
      <PaymentElement id='payment-element' />
      <button disabled={isLoading || !stripe || !elements} id='submit'>
        <span id='button-text'>{isLoading ? <div className='spinner' id='spinner'></div> : 'Pay now'}</span>
      </button>
      {/* Show any error or success messages */}
      {message && <div id='payment-message'>{message}</div>}
    </form>
  );
}
