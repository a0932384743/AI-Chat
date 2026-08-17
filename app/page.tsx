import ChatApp from "@/components/ChatApp";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 lg:flex-row">
      <ChatApp />
    </main>
  );
}
