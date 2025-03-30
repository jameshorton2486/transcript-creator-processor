
import { Header } from "@/components/Header";
import { DeepgramKeyTester } from "@/components/deepgram/DeepgramKeyTester";

const DeepgramTest = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Deepgram API Key Validator</h1>
          <p className="mb-6 text-slate-600">
            Use this tool to verify if your Deepgram API key is valid and working correctly.
            Your API key is tested directly in your browser and is not stored on any server.
          </p>
          
          <DeepgramKeyTester />
          
          <div className="mt-8 p-4 bg-blue-50 rounded-md text-sm text-blue-700">
            <h2 className="font-medium mb-2">About Deepgram API Keys</h2>
            <p className="mb-2">
              Deepgram API keys are used to authenticate requests to the Deepgram speech-to-text API.
              You can get a free API key by signing up at <a href="https://console.deepgram.com/signup" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Deepgram Console</a>.
            </p>
            <p>
              Note: This validator works in two modes:
              <ul className="list-disc ml-5 mt-2">
                <li>Direct validation against Deepgram's API (when possible)</li>
                <li>Local format validation (when direct validation is not available)</li>
              </ul>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeepgramTest;
