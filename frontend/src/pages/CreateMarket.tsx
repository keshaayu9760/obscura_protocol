import { CreateEventForm } from '@/components/create';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/shared/Card';

export default function CreateMarket() {
  return (
    <div>
      <PageHeader
        title="Market Studio"
        subtitle="Compose a new event book, parameterize it, and send it to chain with private settlement."
      />

      <div className="max-w-2xl mx-auto mt-6">
        <Card className="p-6">
          <CreateEventForm />
        </Card>
        <p className="text-xs text-smoke/40 text-center mt-4">
          Pulse sessions are created automatically every 15 minutes by the session operator.
        </p>
      </div>
    </div>
  );
}
