import Chat from '@/components/Chat';

export default function Home() {
  return (
    <main className="h-screen bg-gray-50 overflow-hidden">
      <div className="container mx-auto py-8 h-full">
        <h1 className="text-3xl font-bold text-center mb-8">AI Chat Interface</h1>
        <Chat />
      </div>
    </main>
  );
}
