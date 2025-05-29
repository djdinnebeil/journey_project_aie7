# AI Chat Interface Frontend

This is the frontend for the AI Chat Interface application. It's built with Next.js and provides a modern, responsive chat interface for interacting with the AI.

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- OpenAI API key

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Backend Setup

The frontend communicates with a FastAPI backend. To run the backend:

1. Navigate to the `api` directory:
   ```bash
   cd ../api
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```bash
   uvicorn app:app --reload
   ```

The backend will be available at [http://localhost:8000](http://localhost:8000).

## Usage

1. Enter your OpenAI API key in the input field at the top of the chat interface.
2. Type your message in the input field at the bottom.
3. Press Enter or click the Send button to send your message.
4. The AI's response will appear in the chat window.

## Features

- Real-time streaming responses
- Secure API key handling
- Responsive design
- Message history
- Auto-scrolling chat window

## Development

- The main chat component is located in `src/components/Chat.tsx`
- The main page is in `src/app/page.tsx`
- Styles are handled using Tailwind CSS
