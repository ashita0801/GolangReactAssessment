import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mocking the useWebSocket hook
jest.mock('./hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    socket: {
      send: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    isConnected: true,
    error: null,
    sendMessage: jest.fn(),
  }),
}));

test('renders app explanation component', () => {
  render(<App />);
  const explanationTitle = screen.getByText(/Welcome to the Messaging App/i);
  expect(explanationTitle).toBeInTheDocument();
});

test('renders connection status as connected', () => {
  render(<App />);
  const statusText = screen.getByText(/Connected/i);
  expect(statusText).toBeInTheDocument();
});

test('allows the user to input and send a message', () => {
  render(<App />);
  
  // Locate the input field and buttons
  const inputField = screen.getByPlaceholderText(/Type a message.../i);
  const sendButton = screen.getByText(/Send/i);

  // Simulate typing in the input field
  fireEvent.change(inputField, { target: { value: 'Hello, world!' } });
  expect(inputField.value).toBe('Hello, world!');

  // Simulate clicking the send button
  fireEvent.click(sendButton);

  // Verify input field is cleared after sending the message
  expect(inputField.value).toBe('');
});

test('disables input and buttons when disconnected', () => {
  // Mock the WebSocket to simulate disconnected state
  jest.mock('./hooks/useWebSocket', () => ({
    useWebSocket: () => ({
      socket: null,
      isConnected: false,
      error: 'Connection lost',
      sendMessage: jest.fn(),
    }),
  }));

  render(<App />);

  // Locate the input field and buttons
  const inputField = screen.getByPlaceholderText(/Type a message.../i);
  const sendButton = screen.getByText(/Send/i);
  const historyButton = screen.getByText(/View History/i);

  // Verify elements are disabled
  expect(inputField).toBeDisabled();
  expect(sendButton).toBeDisabled();
  expect(historyButton).toBeDisabled();

  // Verify error message is displayed
  const errorMessage = screen.getByText(/Connection lost/i);
  expect(errorMessage).toBeInTheDocument();
});

test('toggles and displays message history', () => {
  render(<App />);

  // Locate the history button
  const historyButton = screen.getByText(/View History/i);

  // Simulate clicking the history button
  fireEvent.click(historyButton);

  // Verify the message history section is visible
  const historyTitle = screen.getByText(/Message History/i);
  expect(historyTitle).toBeInTheDocument();
});

test('displays loading indicator when loading messages', () => {
  render(<App />);

  // Locate the loading message
  const loadingMessage = screen.getByText(/Loading messages.../i);
  expect(loadingMessage).toBeInTheDocument();
});
