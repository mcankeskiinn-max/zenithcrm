import AiAssistantPanel from '@/components/AiAssistantPanel';
import { SupportChat } from '@/components/SupportChat';

export default function AiAssistantPage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] w-full flex-col items-start gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">AI Asistan</h1>
        <p className="text-sm text-muted-foreground">
          Poliçe ve hasar sorgularını doğal dille yönetin, bağlamlı cevaplar alın.
        </p>
      </div>
      <div className="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <AiAssistantPanel />
        <div className="flex w-full justify-start">
          <SupportChat onClose={() => {}} showClose={false} />
        </div>
      </div>
    </div>
  );
}
